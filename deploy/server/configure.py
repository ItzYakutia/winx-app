"""Create server-only credentials and preserve existing configuration on updates."""
import json
import os
import pathlib
import secrets
import sys

root = pathlib.Path(__file__).resolve().parent
os.umask(0o077)
env_path = root / '.env'
values = {}
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            values[key] = value
values.setdefault('POSTGRES_PASSWORD', secrets.token_hex(24))
values.setdefault('INTERNAL_API_KEY', secrets.token_hex(32))
values.setdefault('WINX_UID', str(os.getuid()))
values.setdefault('WINX_GID', str(os.getgid()))
values['WINX_RELEASE'] = sys.argv[1]
env_path.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
env_path.chmod(0o600)
configs = root / 'config'
configs.mkdir(mode=0o700, exist_ok=True)
for template in (root / 'config-templates').glob('*.json'):
    target = configs / (template.stem + '.yaml')
    if target.exists():
        continue
    content = template.read_text().replace('__WINX_DB_PASSWORD__', values['POSTGRES_PASSWORD']).replace('__WINX_API_KEY__', values['INTERNAL_API_KEY'])
    target.write_text(content)
    target.chmod(0o600)
print('Server configuration ready; credentials retained in .env and config/.')
