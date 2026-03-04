'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Search, Check, X, Flame, Trophy, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Friend {
  friendshipId: string;
  id: string;
  name: string | null;
  displayName: string | null;
  avatarSeed: string | null;
  currentStreak: number;
  createdAt: string;
}

interface PendingRequest {
  friendshipId: string;
  id: string;
  name: string | null;
  displayName: string | null;
  avatarSeed: string | null;
  createdAt: string;
}

interface SearchResult {
  id: string;
  name: string | null;
  email: string;
  displayName: string | null;
  avatarSeed: string | null;
  friendshipStatus: string | null;
  friendshipId: string | null;
  isPendingFromMe: boolean;
}

function getAvatarUrl(seed: string | null, name: string | null): string {
  const s = seed || name || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s)}`;
}

export default function SocialPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'activity'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends');
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch('/api/friends?type=pending');
      const data = await res.json();
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleFriendAction = async (action: string, friendId?: string, friendshipId?: string) => {
    setActionLoading(friendId || friendshipId || null);
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, friendId, friendshipId }),
      });
      
      fetchFriends();
      fetchPendingRequests();
      if (searchQuery) searchUsers();
    } catch (error) {
      console.error('Error with friend action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 max-w-md">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'friends' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('friends')}</span>
          </button>
          <Link
            href="/groups"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">{t('groups')}</span>
          </Link>
          <Link
            href="/activity"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">{t('activity')}</span>
          </Link>
        </div>

        {activeTab === 'friends' && (
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {t('searchFriends')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t('searchFriends')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(user.avatarSeed, user.name)}
                            alt="Avatar"
                            className="h-10 w-10 rounded-full bg-muted"
                          />
                          <div>
                            <p className="font-medium">{user.displayName || user.name || 'User'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div>
                          {user.friendshipStatus === 'accepted' ? (
                            <span className="text-sm text-blue-700 font-medium">{t('alreadyFriends')}</span>
                          ) : user.isPendingFromMe ? (
                            <span className="text-sm text-amber-600 font-medium">{t('requestSent')}</span>
                          ) : user.friendshipStatus === 'pending' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleFriendAction('accept', undefined, user.friendshipId!)}
                                disabled={actionLoading === user.friendshipId}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFriendAction('reject', undefined, user.friendshipId!)}
                                disabled={actionLoading === user.friendshipId}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleFriendAction('send', user.id)}
                              disabled={actionLoading === user.id}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {t('sendRequest')}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    {t('pendingRequests')}
                    <span className="ml-auto bg-amber-100 text-amber-800 text-sm px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingRequests.map((request) => (
                      <motion.div
                        key={request.friendshipId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(request.avatarSeed, request.name)}
                            alt="Avatar"
                            className="h-10 w-10 rounded-full bg-muted"
                          />
                          <div>
                            <p className="font-medium">{request.displayName || request.name || 'User'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleFriendAction('accept', undefined, request.friendshipId)}
                            disabled={actionLoading === request.friendshipId}
                          >
                            {t('acceptRequest')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFriendAction('reject', undefined, request.friendshipId)}
                            disabled={actionLoading === request.friendshipId}
                          >
                            {t('rejectRequest')}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('yourFriends')}
                  <span className="ml-auto text-muted-foreground text-sm font-normal">
                    {friends.length} {t('friends').toLowerCase()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('noFriends')}</p>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {friends.map((friend) => (
                        <motion.div
                          key={friend.friendshipId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={getAvatarUrl(friend.avatarSeed, friend.name)}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full bg-muted"
                            />
                            <div>
                              <p className="font-medium">{friend.displayName || friend.name || 'User'}</p>
                              {friend.currentStreak > 0 && (
                                <p className="text-sm text-amber-600 flex items-center gap-1">
                                  🔥 {friend.currentStreak} {t('streakDays').toLowerCase()}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleFriendAction('remove', undefined, friend.friendshipId)}
                            disabled={actionLoading === friend.friendshipId}
                          >
                            {t('removeFriend')}
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
