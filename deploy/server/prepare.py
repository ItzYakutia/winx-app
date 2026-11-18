"""Package runtime configuration templates without local passwords or sessions."""
import argparse
import json
import pathlib
import shutil
import yaml

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=pathlib.Path, required=True)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[2]
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
for name in ['.dockerignore', 'Dockerfile', 'frontend.Dockerfile', 'compose.yaml', 'configure.py', 'start.sh', 'winx-proxy.conf', 'renew-certificate.sh']:
    shutil.copy2(pathlib.Path(__file__).parent / name, out / name)
shutil.copy2(root / 'frontend/nginx.conf', out / 'nginx.conf')
shutil.copytree(root / 'frontend/dist/winx-frontend/browser', out / 'frontend', dirs_exist_ok=True)
shutil.copytree(root / 'api-gateway/swagger', out / 'swagger', dirs_exist_ok=True)
(out / 'config-templates').mkdir(exist_ok=True)
(out / 'migrations').mkdir(exist_ok=True)
services = ['auth', 'notification', 'profile', 'match', 'recommendation', 'chat', 'api-gateway']
versions = set()
for service in services:
    config = yaml.safe_load((root / service / 'config.dev.yaml').read_text(encoding='utf-8'))
    config['app']['environment'] = 'production'
    config['app']['key'] = '__WINX_API_KEY__'
    if 'db' in config:
        config['db']['postgres']['password'] = '__WINX_DB_PASSWORD__'
    if 'graylog' in config:
        config['graylog']['host'] = ''
    for upstream in config.get('services', {}).values():
        upstream['api_key'] = '__WINX_API_KEY__'
    if service == 'api-gateway':
        config['pilot']['mode'] = False
    if 's3' in config:
        config['s3']['access_key_id'] = ''
        config['s3']['secret_access_key'] = ''
    if 'smtp' in config:
        config['smtp']['username'] = ''
        config['smtp']['password'] = ''
    if 'resend' in config:
        config['resend']['api_key'] = ''
    (out / 'config-templates' / (service + '.json')).write_text(json.dumps(config, indent=2) + '\n', encoding='utf-8')
    for migration in (root / service / 'migrations/migrations').glob('*.sql'):
        version = migration.name.split('_', 1)[0]
        if version in versions:
            raise RuntimeError('Duplicate migration version: ' + version)
        versions.add(version)
        shutil.copy2(migration, out / 'migrations' / migration.name)
print(f'Prepared {len(services)} services and {len(versions)} SQL migrations.')
