// 데이터를 모아 public/data.json 으로 저장 (GitHub Actions에서 매일 실행)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { refresh } = require('../lib/refresh');

refresh()
  .then((c) => {
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'data.json'), JSON.stringify(c));
    console.log('public/data.json 생성 완료');
  })
  .catch((e) => { console.error('데이터 수집 실패:', e.message); process.exit(1); });
