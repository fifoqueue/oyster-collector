const { Collection } = require('@discordjs/collection');
const fs = require('node:fs');

(() => {
  /*
  ** Initialization - data/old.json과 data/new.json 파일을 각각 읽어온 후 oldFile, newFile 변수에 내용을 저장함.
  ** JSON 파일은 require()를 사용해서 불러올 수도 있으나 캐시 문제로 fs와 연계, JSON.parse를 사용함
   */
  const [oldFile, newFile] = ['./data/old.json', './data/new.json']
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));

  // 시간복잡도 문제 때문에 Array 말고 Collection으로 처리
  const oldFileCollection = new Collection();
  const newFileCollection = new Collection();
  // oldFile에 있는 댓글들도 Collection으로 변환
  oldFile.forEach((comment) => {
    comment.replies = new Collection(comment.replies.map((reply) => [reply.id, reply]));
    oldFileCollection.set(comment.id, comment);
  });
  // 상동
  newFile.forEach((comment) => {
    comment.replies = new Collection(comment.replies.map((reply) => [reply.id, reply]));
    newFileCollection.set(comment.id, comment);
  });

  // 삭제된 댓글, 답글 저장용 변수 생성
  const deletedComments = [...oldFileCollection.filter((m) => !newFileCollection.has(m.id)).values()];
  const deletedReplies = [];

  // deletedComments의 내용을 newFile과 합친 후 댓글 작성 일자로 내림차순 정렬 실행
  const mergedFile = newFile.concat(deletedComments).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  // 이 내용 또한 Collection으로 변환
  const mergedFileCollection = new Collection();
  mergedFile.forEach((comment) => {
    comment.replies = new Collection(comment.replies.map((reply) => [reply.id, reply]));
    mergedFileCollection.set(comment.id, comment);
  });

  /*
  ** 삭제된 답글 수집 루틴
  ** oldFileCollection (구 댓글)에는 있는데 mergedFileCollection (새 댓글)에는 없는 답글이 있다?
  ** => 원래 있다가 삭제된 답글이므로 deletedReplies 배열에 push
   */
  oldFileCollection.forEach((comment) => {
    const mergedReplies = mergedFileCollection.get(comment.id).replies;
    comment.replies.forEach((reply) => {
      const existingComment = mergedReplies.get(reply.id);
      if (!existingComment) {
        /*
        ** YouTube 답글의 고유 ID는 <부모 댓글 고유 ID.자신의 고유 ID> 형태이기 때문에
        ** 사실 parentId를 굳이 지정할 필요는 없으나 ID를 전부 split('.')하면서 돌리는 건 비효율적이므로 추가
         */
        const obj = { ...reply, parentId: comment.id };
        deletedReplies.push(obj);
        mergedReplies.set(reply.id, reply);
      }
    });
  });

  /*
  ** 답글 메타데이터 업데이트 루틴
  ** mergedFileCollection (새 댓글 + 삭제된 댓글들)에 있는 답글 중
  ** newFileCollection (새 댓글)에 있는 정보와 일치하지 않는 답글이 있다?
  ** => newFileCollection 기준으로 해당 정보를 갱신함
  ** 왜 oldFileCollection과 비교하지 않는가?
  ** => oldFileCollection에 없는데 mergedFileCollection에는 있는 답글이 있으면 매우 골치가 아파짐
   */
  mergedFileCollection.forEach((comment) => {
    const newReplies = newFileCollection.get(comment.id)?.replies;
    if (!newReplies) return;
    comment.replies.forEach((reply) => {
      const existingComment = newReplies.get(reply.id);
      if (existingComment.likeCount !== reply.likeCount
        || existingComment.updatedAt !== reply.updatedAt) {
        newReplies.set(reply.id, reply);
      }
    });
    // 원래 YouTube API에서 뱉어주는 대로 답글 달린 순으로 오름차순 정렬
    comment.replies.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    // 작업 끝났으므로 Collection을 다시 Array로 변환
    comment.replies = [...comment.replies.values()];
  });

  /*
  ** deletedComments도 루프 돌면서 replies 내용 Array로 변환
  ** 왜인지는 도저히 모르겠는데 deletedComments 선언 직후 루프 돌리면 스크립트 끝에 가서 변경 사항이 롤백됨
   */
  deletedComments.forEach((comment) => {
    comment.replies = [...comment.replies.values()];
  });

  // 파일명 충돌 방지용 timestamp
  const now = Date.now();
  fs.writeFileSync(`./data/merged-${now}.json`, JSON.stringify([...mergedFileCollection.values()], null, 2));
  fs.writeFileSync(`./data/deleted-comments-${now}.json`, JSON.stringify({
    comments: deletedComments,
    replies: deletedReplies,
  }, null, 2));
})();
