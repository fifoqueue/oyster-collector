# 댓굴 수집기 🦪
[YouTube 공식 API](https://developers.google.com/youtube/v3)를 사용하여 특정 유튜브 영상에 달린 모든 댓글과 답글을 받아옵니다.

[Node.js](https://nodejs.org) 20 이상 또는 이와 호환되는 버전의 Javascript Runtime에서 정상 작동합니다. 

> [!WARNING]  
> YouTube 공식 API는 별도로 추가 사용량을 신청하지 않은 이상 일일 10,000회로 요청 수가 제한됩니다. 이 프로젝트는 API 호출 횟수가 일일 10,000회를 초과하는 use-case에 적합하지 않으며, 관련한 오류에 대해 별도로 처리를 하지 않았습니다.

# 설치 방법
```bash
git clone https://github.com/fifoqueue/oyster-collector.git
cd oyster-collector
cp config.example.json config.json
nano config.json
yarn install
```

# 컨피그 작성 방법
```json
{
  "apiKey": "[YouTube API 키 입력]",
  "videoId": "[동영상 ID'만' 입력]"
}
```

API 키는 [공식 가이드](https://developers.google.com/youtube/v3/getting-started?hl=ko)를 참고하여 발급받을 수 있습니다.

동영상 ID는, 전체 URL이 `https://www.youtube.com/watch?v=HhVgYRfxW2Q` 인 경우 `HhVgYRfxW2Q`입니다.

# 사용 방법
`config.json` 파일에 작성한 내용대로 동영상의 모든 댓글, 답글을 받아오려면 프로젝트 루트 디렉터리에서 `node .` 를 실행하십시오.

결과는 `data` 폴더에 저장되며, 각각 다른 시기에 수집된 두 파일들을 비교하여 병합하고 싶은 경우 프로젝트 루트 디렉터리에서 `node merge-comments` 를 실행하십시오. 이 때 두 파일은 `data` 디렉터리에 각각 `old.json`, `new.json` 으로 저장하면 됩니다.

# 라이선스
AGPL 3.0 또는 이후 라이선스로 배포됩니다.

# 왜 이름이 댓"굴" 수집기인가요?
You may know the reason why 🦪🤣