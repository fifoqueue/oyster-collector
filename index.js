#!/usr/bin/env node
const fs = require('node:fs');
const axios = require('axios');
const config = require('./config.json');

let apiRequestCount = 0;
const instance = axios.create({
  params: { key: config.apiKey },
  validateStatus() { return true; },
});
instance.interceptors.request.use((config) => {
  apiRequestCount++;
  return config;
});
instance.interceptors.response.use((ctx) => (ctx.config.raw ? ctx : ctx.data));

(async () => {
  const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
  url.searchParams.append('part', 'replies');
  url.searchParams.append('part', 'snippet');
  url.searchParams.set('maxResults', '100');
  url.searchParams.set('videoId', config.videoId);

  console.log(`${config.videoId} 영상의 모든 댓글 수집을 시작합니다.`);

  let count = 0;
  const resComments = [];
  while (true) {
    const resp = await instance.get(url);
    if (!resp.items?.length) {
      console.log(resp);
      break;
    }
    const comments = await Promise.all(resp.items.map(async (item) => {
      let replies = item.replies?.comments;
      const mainComment = item.snippet.topLevelComment.snippet;
      const mainCommentId = item.snippet.topLevelComment.id;

      if ((replies?.length ?? 0) < item.snippet.totalReplyCount) {
        replies = [];

        const commentUrl = new URL('https://www.googleapis.com/youtube/v3/comments');
        commentUrl.searchParams.append('part', 'id');
        commentUrl.searchParams.append('part', 'snippet');
        commentUrl.searchParams.set('maxResults', '100');
        commentUrl.searchParams.set('parentId', mainCommentId);
        while (true) {
          const replyResp = await instance.get(commentUrl);
          if (!replyResp.items?.length) break;
          replies.push(replyResp.items);
          replies = replies.flat();
          console.log(`${mainCommentId} 댓글의 답글 ${replyResp.items.length}개 가져옴.`);

          if (replyResp.nextPageToken) {
            commentUrl.searchParams.set('pageToken', replyResp.nextPageToken);
          } else {
            break;
          }
        }
      }

      return {
        id: mainCommentId,
        text: mainComment.textOriginal,
        author: {
          name: mainComment.authorDisplayName,
          channelId: mainComment.authorChannelId.value,
        },
        likeCount: mainComment.likeCount,
        createdAt: mainComment.publishedAt,
        updatedAt: mainComment.updatedAt === mainComment.publishedAt ? null : mainComment.updatedAt,
        replies: replies?.map((reply) => {
          const mainReply = reply.snippet;
          return {
            id: reply.id,
            text: mainReply.textOriginal,
            likeCount: mainReply.likeCount,
            author: {
              name: mainReply.authorDisplayName,
              channelId: mainReply.authorChannelId.value,
            },
            createdAt: mainReply.publishedAt,
            updatedAt: mainReply.updatedAt === mainReply.publishedAt ? null : mainReply.updatedAt,
          };
        }) ?? [],
      };
    }));
    resComments.push(comments);
    url.searchParams.set('pageToken', resp.nextPageToken);
    count += comments.length;
    console.log(`${count}개 수집됨. 다음 페이지 토큰: ${url.searchParams.get('pageToken')}`);
  }

  console.log(`댓글 수집이 모두 완료되었으며 ${apiRequestCount}회의 API 요청이 수행되었습니다.`);
  fs.writeFileSync(`./data/comments-${config.videoId}-${Date.now()}.json`, JSON.stringify(resComments.flat(), null, 2));
})();
