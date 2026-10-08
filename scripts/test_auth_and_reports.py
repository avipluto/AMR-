import urllib.request
import json

# 1. Test Login
login_data = json.dumps({'email': 'researcher@amrsentinel.org', 'password': 'Biotech2026!'}).encode()
req = urllib.request.Request('http://127.0.0.1:8001/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
token_resp = json.loads(res.read().decode())
token = token_resp['access_token']
print('Login OK:', token_resp['user']['full_name'], 'Role:', token_resp['user']['role'])

# 2. Test PDF Generation
analysis_payload = {
    'analysis_data': {
        'summary': {'organism': 'Escherichia coli'},
        'calibration_method': 'known_disk_6mm',
        'pixels_per_mm': 5.0,
        'disks': [
            {'antibiotic_name': 'Ciprofloxacin', 'antibiotic_code': 'CIP', 'disk_diameter_mm': 6.0, 'zone_diameter_mm': 12.4, 'interpretation': {'classification': 'R', 'breakpoints': {'susceptible': '>= 26 mm', 'resistant': '<= 21 mm'}}},
            {'antibiotic_name': 'Gentamicin', 'antibiotic_code': 'GEN', 'disk_diameter_mm': 6.0, 'zone_diameter_mm': 21.0, 'interpretation': {'classification': 'S', 'breakpoints': {'susceptible': '>= 15 mm', 'resistant': '<= 12 mm'}}},
            {'antibiotic_name': 'Ampicillin', 'antibiotic_code': 'AMP', 'disk_diameter_mm': 6.0, 'zone_diameter_mm': 8.3, 'interpretation': {'classification': 'R', 'breakpoints': {'susceptible': '>= 17 mm', 'resistant': '<= 13 mm'}}}
        ]
    }
}
req_pdf = urllib.request.Request(
    'http://127.0.0.1:8001/api/reports/generate/ast',
    data=json.dumps(analysis_payload).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
)
res_pdf = urllib.request.urlopen(req_pdf)
pdf_resp = json.loads(res_pdf.read().decode())
print('PDF Generation OK:', pdf_resp['report_id'], 'URL:', pdf_resp['download_url'])

# 3. Test PDF Download
req_dl = urllib.request.Request(f'http://127.0.0.1:8001{pdf_resp["download_url"]}')
res_dl = urllib.request.urlopen(req_dl)
content = res_dl.read()
print('PDF Download status:', res_dl.getcode(), 'Bytes received:', len(content), 'Magic header:', content[:4])

# 4. Test List Reports
req_list = urllib.request.Request(
    'http://127.0.0.1:8001/api/reports',
    headers={'Authorization': f'Bearer {token}'}
)
res_list = urllib.request.urlopen(req_list)
print('Reports listed:', len(json.loads(res_list.read().decode())))
