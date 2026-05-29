export type DbUser = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  followers: number;
  following: number;
  createdAt: Date;
};

export type DbDrop = {
  id: string;
  authorHandle: string;
  body: string;
  parentId: string | null;
  replyCount: number;
  likeCount: number;
  repostCount: number;
  embeddedLang: string | null;
  embeddedCode: string | null;
  tags: string;
  createdAt: Date;
};

export type DbLike = {
  userHandle: string;
  dropId: string;
  createdAt: Date;
};

export type DbRepost = {
  userHandle: string;
  dropId: string;
  createdAt: Date;
};

export type DbBookmark = {
  userHandle: string;
  dropId: string;
  createdAt: Date;
};

export type DbFollow = {
  followerHandle: string;
  targetHandle: string;
  createdAt: Date;
};
