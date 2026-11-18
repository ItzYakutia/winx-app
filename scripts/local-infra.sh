#!/usr/bin/env bash
set -euo pipefail

runtime="${XDG_DATA_HOME:-$HOME/.local/share}/winx-app"
pg_bin=/usr/lib/postgresql/16/bin
kafka_version=4.0.0
kafka_dir="$runtime/tools/kafka_2.13-$kafka_version"
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"

setup() {
    if [[ $EUID != 0 ]]; then
        echo 'Run setup as root: wsl -d Ubuntu -u root -- bash scripts/local-infra.sh setup' >&2
        exit 1
    fi
    export DEBIAN_FRONTEND=noninteractive
    local had_redis=false had_postgres=false
    command -v redis-server >/dev/null && had_redis=true
    [[ -x $pg_bin/initdb ]] && had_postgres=true
    apt-get update -qq
    apt-get install -y --no-install-recommends curl ca-certificates gnupg
    if [[ ! -f /usr/share/keyrings/mongodb-server-8.0.gpg ]]; then
        curl -fsSL https://pgp.mongodb.com/server-8.0.asc |
            gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
    fi
    printf '%s\n' 'deb [arch=amd64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse' > /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt-get update -qq
    apt-get install -y --no-install-recommends postgresql-16 postgresql-16-postgis-3 redis-server openjdk-17-jre-headless mongodb-org-server
    # The project starts its own instances and keeps their data in the user's runtime.
    if [[ $had_redis == false ]]; then
        service redis-server stop
        systemctl disable redis-server.service >/dev/null 2>&1 || true
    fi
    if [[ $had_postgres == false && -f /etc/postgresql/16/main/start.conf ]]; then
        pg_ctlcluster 16 main stop || true
        printf 'manual\n' > /etc/postgresql/16/main/start.conf
    fi
}

wait_port() {
    local port=$1
    for ((attempt=0; attempt<90; attempt++)); do
        if (echo > "/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
            return 0
        fi
        sleep 1
    done
    echo "Port $port did not become ready. Check $runtime/logs" >&2
    return 1
}

start() {
    if [[ $EUID == 0 ]]; then
        echo 'Run start as the normal Ubuntu user, not root.' >&2
        exit 1
    fi
    for tool in "$pg_bin/initdb" redis-server mongod "$JAVA_HOME/bin/java"; do
        if ! command -v "$tool" >/dev/null; then
            echo "Missing $tool. Run setup first." >&2
            exit 1
        fi
    done
    mkdir -p "$runtime"/{tools,downloads,logs,data/postgres,data/mongo,data/redis,data/kafka}
    chmod 700 "$runtime/data/postgres"
    if [[ ! -f "$runtime/data/postgres/PG_VERSION" ]]; then
        local password_file
        password_file=$(mktemp)
        chmod 600 "$password_file"
        printf '%s\n' winx > "$password_file"
        "$pg_bin/initdb" -D "$runtime/data/postgres" -U winx --encoding=UTF8 --locale=C.UTF-8 --auth-local=trust --auth-host=scram-sha-256 --pwfile="$password_file"
        rm -f -- "$password_file"
        printf '\nport = 55432\nlisten_addresses = '\''127.0.0.1'\''\nunix_socket_directories = '\''%s'\''\n' "$runtime" >> "$runtime/data/postgres/postgresql.conf"
    fi
    if ! "$pg_bin/pg_ctl" -D "$runtime/data/postgres" status >/dev/null 2>&1; then
        "$pg_bin/pg_ctl" -D "$runtime/data/postgres" -l "$runtime/logs/postgres.log" start -w
    fi
    export PGPASSWORD=winx
    if [[ $("$pg_bin/psql" -h 127.0.0.1 -p 55432 -U winx -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='winx-db'") != 1 ]]; then
        "$pg_bin/createdb" -h 127.0.0.1 -p 55432 -U winx winx-db
    fi
    unset PGPASSWORD

    if ! (echo > /dev/tcp/127.0.0.1/6379) 2>/dev/null; then
        redis-server --bind 127.0.0.1 --port 6379 --daemonize yes --appendonly yes --dir "$runtime/data/redis" --pidfile "$runtime/redis.pid" --logfile "$runtime/logs/redis.log"
    fi
    if ! (echo > /dev/tcp/127.0.0.1/27017) 2>/dev/null; then
        mongod --bind_ip 127.0.0.1 --port 27017 --fork --dbpath "$runtime/data/mongo" --logpath "$runtime/logs/mongo.log" --pidfilepath "$runtime/mongo.pid" --wiredTigerCacheSizeGB 0.5
    fi

    if [[ ! -x "$kafka_dir/bin/kafka-server-start.sh" ]]; then
        local archive="kafka_2.13-$kafka_version.tgz"
        local base_url="https://archive.apache.org/dist/kafka/$kafka_version"
        curl -fsSL "$base_url/$archive.sha512" -o "$runtime/downloads/$archive.sha512"
        local expected actual
        expected=$(sed '1s/^[^:]*:[[:space:]]*//' "$runtime/downloads/$archive.sha512" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
        if [[ ! -f "$runtime/downloads/$archive" ]] || [[ $(sha512sum "$runtime/downloads/$archive" | cut -d ' ' -f 1) != "$expected" ]]; then
            curl -fL --retry 3 "$base_url/$archive" -o "$runtime/downloads/$archive"
        fi
        actual=$(sha512sum "$runtime/downloads/$archive" | cut -d ' ' -f 1)
        if [[ -z $expected || $expected != "$actual" ]]; then
            echo 'Kafka SHA-512 checksum does not match.' >&2
            exit 1
        fi
        tar -xzf "$runtime/downloads/$archive" -C "$runtime/tools"
    fi
    cat > "$runtime/kafka.properties" <<EOF
process.roles=broker,controller
node.id=1
controller.quorum.bootstrap.servers=127.0.0.1:9093
listeners=PLAINTEXT://127.0.0.1:9092,CONTROLLER://127.0.0.1:9093
advertised.listeners=PLAINTEXT://127.0.0.1:9092
controller.listener.names=CONTROLLER
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
inter.broker.listener.name=PLAINTEXT
log.dirs=$runtime/data/kafka
num.partitions=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
group.initial.rebalance.delay.ms=0
auto.create.topics.enable=true
log.retention.hours=24
EOF
    export KAFKA_HEAP_OPTS='-Xms256m -Xmx512m'
    # Explicit IPv4 sockets allow WSL's localhost forwarding to reach Java from Windows.
    export KAFKA_OPTS="${KAFKA_OPTS:-} -Djava.net.preferIPv4Stack=true"
    export LOG_DIR="$runtime/logs"
    if [[ ! -f "$runtime/data/kafka/meta.properties" ]]; then
        local cluster_id
        cluster_id=$("$kafka_dir/bin/kafka-storage.sh" random-uuid)
        "$kafka_dir/bin/kafka-storage.sh" format --standalone -t "$cluster_id" -c "$runtime/kafka.properties"
    fi
    if ! (echo > /dev/tcp/127.0.0.1/9092) 2>/dev/null; then
        nohup "$kafka_dir/bin/kafka-server-start.sh" "$runtime/kafka.properties" > "$runtime/logs/kafka.log" 2>&1 < /dev/null &
        echo $! > "$runtime/kafka.pid"
    fi
    for port in 55432 6379 27017 9092; do
        wait_port "$port"
    done
    for topic in user.registered user.password match.created swipe.left swipe.right; do
        "$kafka_dir/bin/kafka-topics.sh" --bootstrap-server 127.0.0.1:9092 --create --if-not-exists --topic "$topic" --partitions 1 --replication-factor 1
    done
    echo 'Winx infrastructure is ready: PostgreSQL 55432, Redis 6379, MongoDB 27017, Kafka 9092.'
}

stop_owned_process() {
    local pid_file=$1 marker=$2
    if [[ -f $pid_file ]]; then
        local process_id
        process_id=$(cat "$pid_file")
        if [[ $process_id =~ ^[0-9]+$ && -r /proc/$process_id/cmdline ]] &&
            tr '\0' ' ' < "/proc/$process_id/cmdline" | grep -Fq -- "$marker"; then
            kill -TERM "$process_id"
            for ((attempt=0; attempt<100; attempt++)); do
                if [[ ! -r /proc/$process_id/stat ]] || [[ $(awk '{print $3}' "/proc/$process_id/stat") == Z ]]; then
                    break
                fi
                sleep 0.1
            done
        fi
    fi
}

stop() {
    stop_owned_process "$runtime/kafka.pid" "$runtime/kafka.properties"
    stop_owned_process "$runtime/mongo.pid" "$runtime/data/mongo"
    stop_owned_process "$runtime/redis.pid" 'redis-server 127.0.0.1:6379'
    if [[ -f "$runtime/data/postgres/PG_VERSION" ]] && "$pg_bin/pg_ctl" -D "$runtime/data/postgres" status >/dev/null 2>&1; then
        "$pg_bin/pg_ctl" -D "$runtime/data/postgres" stop -m fast -w
    fi
    echo 'Winx infrastructure stopped. Data is preserved.'
}

case "${1:-start}" in
    setup) setup ;;
    start) start ;;
    stop) stop ;;
    *) echo 'Usage: local-infra.sh setup|start|stop' >&2; exit 2 ;;
esac
