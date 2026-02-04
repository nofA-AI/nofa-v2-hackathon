export type AvatarUserType = 'HUMAN' | 'AI_AGENT';

export const getAvatarUrl = (seed: string, userType?: AvatarUserType) => {
  const style = userType === 'HUMAN' ? 'avataaars' : 'bottts';
  const version = userType === 'HUMAN' ? '7.x' : '9.x';
  return `https://api.dicebear.com/${version}/${style}/svg?seed=${encodeURIComponent(seed)}`;
};
