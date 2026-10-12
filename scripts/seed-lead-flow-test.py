"""Seed clearly labelled test leads through production import/assignment APIs.

Run on the VPS. Uses temporary sessions, never places phone calls, and preserves
existing records. Backup includes SQLite WAL via the SQLite backup API.
"""
import hashlib
import json
import secrets
import sqlite3
import time
import urllib.request
from datetime import datetime
from pathlib import Path

BASE = "https://crmdemo.vanvucoder.id.vn"
BATCH = "[TEST] Data goi va phan cong 20261011.xlsx"
db = sqlite3.connect('/var/lib/crm-demo/dev.db', timeout=20)
db.row_factory = sqlite3.Row
sessions = []

def session(user_id):
    token = secrets.token_hex(32)
    sid = hashlib.sha256(token.encode()).hexdigest()
    db.execute('INSERT INTO Session(id,userId,expiresAt) VALUES(?,?,?)',
               (sid, user_id, int(time.time()*1000)+600000))
    db.commit()
    sessions.append(sid)
    return token

def post(path, data, token):
    req = urllib.request.Request(BASE+path, json.dumps(data).encode(),
          {'Content-Type':'application/json', 'Origin':BASE,
           'Cookie':'crm_session='+token}, method='POST')
    with urllib.request.urlopen(req, timeout=60) as response:
        result = json.load(response)
    if not result.get('success'):
        raise RuntimeError(result)
    return result

try:
    existing = db.execute('SELECT id FROM LeadImportBatch WHERE filename=?', (BATCH,)).fetchone()
    if existing:
        print('Seed batch already exists; preserving current test progress.')
        batch_id = existing['id']
    else:
        backup_dir = Path('/root/crm-seed-backups')
        backup_dir.mkdir(mode=0o700, exist_ok=True)
        backup_path = backup_dir / ('before-lead-seed-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.db')
        backup = sqlite3.connect(backup_path)
        db.backup(backup)
        backup.close()
        backup_path.chmod(0o600)
        admin = db.execute("SELECT id FROM User WHERE role='ADMIN' LIMIT 1").fetchone()['id']
        sales = list(db.execute("SELECT id,name,extension FROM User WHERE role='SALES' ORDER BY extension"))
        if len(sales) != 7:
            raise RuntimeError('Expected seven existing Sales accounts, got '+str(len(sales)))
        token = session(admin)
        industries = ['May mặc','Nội thất','Điện tử','Thực phẩm','Máy móc','Nhựa','Nông sản']
        routes = ['Nhập FCL Trung Quốc → Hải Phòng','Nhập LCL Singapore → Cát Lái',
                  'Xuất FCL Việt Nam → Mỹ','Xuất LCL Việt Nam → Nhật','Vận chuyển nội địa']
        cities = ['Hà Nội','Hải Phòng','TP. Hồ Chí Minh','Đà Nẵng','Bình Dương']
        rows = []
        for i in range(1, 211):
            rows.append({'name':f'[TEST] Liên hệ {i:03d}', 'phone':f'0000{i:06d}',
                'company':f'[TEST] Công ty {industries[i%7]} {i:03d}',
                'taxId':f'0000{i:06d}', 'address':f'{i} Đường kiểm thử, {cities[i%5]}',
                'industry':industries[i%7], 'needs':'DỮ LIỆU TEST — KHÔNG GỌI SỐ NÀY. '+routes[i%5],
                'source':'EXCEL'})
        imported = post('/api/leads/import', {'filename':BATCH,'rows':rows}, token)
        batch_id = imported['batchId']
        print('imported', imported['imported'])
        assigned = post('/api/leads/assign', {'salesIds':[s['id'] for s in sales],
                         'count':105,'batchId':batch_id}, token)
        print('assigned', assigned['assigned'], 'pool', assigned['remaining'])
        now = int(time.time()*1000)
        outcomes = ['NO_ANSWER','NO_NEED','USING_OTHER','INTERESTED','INTERESTED']
        for index, staff in enumerate(sales):
            items = list(db.execute('SELECT id FROM Lead WHERE importBatchId=? AND salesId=? ORDER BY createdAt,id',
                                    (batch_id,staff['id'])))
            handled = len(items) if index >= 5 else 5
            for j, item in enumerate(items[:handled]):
                outcome = outcomes[j%5]
                interested = outcome == 'INTERESTED'
                at = now-(j%4+1)*86400000
                follow = now+(-1 if j%2==0 else 2)*86400000 if interested else None
                history = json.dumps([{'at':datetime.fromtimestamp(at/1000).isoformat(),
                    'by':staff['name'], 'callOutcome':outcome,
                    'needs':'[TEST] Kịch bản chăm sóc để thử bộ lọc, không phải cuộc gọi thật.'}], ensure_ascii=False)
                db.execute('UPDATE Lead SET status=?,callOutcome=?,interestState=?,isInterested=?,firstContactAt=?,lastContactAt=?,followUpAt=?,contactHistory=?,updatedAt=? WHERE id=?',
                    ('IN_PROGRESS',outcome,'YES' if interested else 'NO',int(interested),at,at,follow,history,now,item['id']))
            db.commit()
            if index >= 5:
                request = post('/api/leads/data-requests',{},session(staff['id']))
                db.execute('UPDATE LeadDataRequest SET note=? WHERE id=?',
                           ('[TEST] Đã xử lý hết data được giao, xin cấp thêm để test luồng.',request['requestId']))
                db.commit()
        print('backup', str(backup_path))
    print('test_leads', db.execute('SELECT count(*) FROM Lead WHERE importBatchId=?',(batch_id,)).fetchone()[0])
    print('unassigned', db.execute('SELECT count(*) FROM Lead WHERE importBatchId=? AND salesId IS NULL',(batch_id,)).fetchone()[0])
    for row in db.execute('SELECT u.name,u.extension,count(*) AS total,sum(CASE WHEN l.status=\'NEW\' AND l.callOutcome=\'UNKNOWN\' THEN 1 ELSE 0 END) AS untouched FROM Lead l JOIN User u ON u.id=l.salesId WHERE importBatchId=? GROUP BY u.id ORDER BY u.extension',(batch_id,)):
        print(json.dumps(dict(row),ensure_ascii=False))
    print('integrity',db.execute('PRAGMA integrity_check').fetchone()[0])
finally:
    for sid in sessions:
        db.execute('DELETE FROM Session WHERE id=?',(sid,))
    db.commit()
    db.close()
