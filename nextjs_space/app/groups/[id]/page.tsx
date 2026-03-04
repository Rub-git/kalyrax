'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Crown, UserPlus, LogOut, Trash2, Play, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface GroupMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    profile: {
      displayName: string | null;
      avatarSeed: string | null;
    } | null;
    userStreak: {
      currentStreak: number;
    } | null;
  };
}

interface GroupChallenge {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  isParticipating: boolean;
  participantCount: number;
  template: {
    id: string;
    name: string;
    nameEs: string;
    durationDays: number;
  };
}

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  avatarSeed: string | null;
  isPublic: boolean;
  isMember: boolean;
  userRole: string | null;
  owner: {
    id: string;
    name: string | null;
    profile: {
      displayName: string | null;
      avatarSeed: string | null;
    } | null;
  };
  members: GroupMember[];
  challenges: GroupChallenge[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  displayName: string | null;
  avatarSeed: string | null;
  progressDays: number;
  streak: number;
  points: number;
}

function getAvatarUrl(seed: string | null, name: string | null): string {
  const s = seed || name || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s)}`;
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<{ friendshipId: string; id: string; name: string | null; displayName: string | null }[]>([]);

  const userId = (session?.user as { userId?: string })?.userId;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroup();
      fetchChallenges();
    }
  }, [status, id]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${id}`);
      const data = await res.json();
      setGroup(data.group || null);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`/api/groups/${id}/challenges`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchLeaderboard = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/groups/${id}/challenges?challengeId=${challengeId}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setSelectedChallenge(challengeId);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends');
      const data = await res.json();
      setFriends(data.friends || []);
      setShowInviteModal(true);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleInvite = async (friendId: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/groups/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', friendId }),
      });
      fetchGroup();
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting friend:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/groups/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
      });
      router.push('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      router.push('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/groups/${id}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', challengeId }),
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Group not found</p>
              <Link href="/groups">
                <Button className="mt-4">Back to Groups</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isOwner = group.owner.id === userId;
  const isAdmin = group.userRole === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/groups" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          ← {t('groupsTitle')}
        </Link>

        {/* Group Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <img
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(group.avatarSeed || group.name)}`}
                alt={group.name}
                className="h-16 w-16 rounded-lg bg-muted"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground mt-1">{group.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.members.length} {t('members')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {challenges.length} {t('challenges')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {group.isMember && (
                  <Button variant="outline" size="sm" onClick={fetchFriends}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    {t('inviteFriends')}
                  </Button>
                )}
                {group.isMember && !isOwner && (
                  <Button variant="outline" size="sm" onClick={handleLeaveGroup} disabled={actionLoading}>
                    <LogOut className="h-4 w-4 mr-1" />
                    {t('leaveGroup')}
                  </Button>
                )}
                {isOwner && (
                  <Button variant="destructive" size="sm" onClick={handleDeleteGroup} disabled={actionLoading}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('deleteGroup')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('members')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarUrl(member.user.profile?.avatarSeed || null, member.user.name)}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full bg-muted"
                      />
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          {member.user.profile?.displayName || member.user.name || 'User'}
                          {member.role === 'admin' && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                        </p>
                      </div>
                    </div>
                    {member.user.userStreak && member.user.userStreak.currentStreak > 0 && (
                      <span className="text-sm text-amber-600">🔥 {member.user.userStreak.currentStreak}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t('groupChallenges')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{t('noGroupChallenges')}</p>
              ) : (
                <div className="space-y-3">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {language === 'es' ? challenge.template.nameEs : challenge.template.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {challenge.participantCount} {t('participants')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {challenge.isParticipating ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchLeaderboard(challenge.id)}
                            >
                              <Medal className="h-4 w-4 mr-1" />
                              {t('groupLeaderboard')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleJoinChallenge(challenge.id)}
                              disabled={actionLoading}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {t('joinChallenge')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {selectedChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedChallenge(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  {t('groupLeaderboard')}
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.rank <= 3 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          entry.rank === 1 ? 'text-amber-500' :
                          entry.rank === 2 ? 'text-gray-400' :
                          entry.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'
                        }`}>
                          #{entry.rank}
                        </span>
                        <img
                          src={getAvatarUrl(entry.avatarSeed, entry.name)}
                          alt="Avatar"
                          className="h-8 w-8 rounded-full bg-muted"
                        />
                        <span className="font-medium">
                          {entry.displayName || entry.name || 'User'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.points} pts</p>
                        <p className="text-xs text-muted-foreground">
                          🔥 {entry.streak} | Day {entry.progressDays}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" onClick={() => setSelectedChallenge(null)}>
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite Friends Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowInviteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl"
              >
                <h2 className="text-xl font-bold mb-4">{t('inviteFriends')}</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {friends.filter(f => !group.members.some(m => m.userId === f.id)).map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span>{friend.displayName || friend.name || 'User'}</span>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(friend.id)}
                        disabled={actionLoading}
                      >
                        Invite
                      </Button>
                    </div>
                  ))}
                  {friends.filter(f => !group.members.some(m => m.userId === f.id)).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      All your friends are already in this group!
                    </p>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => setShowInviteModal(false)}>
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
