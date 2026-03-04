'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Trophy, ChevronRight, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarSeed: string | null;
  isPublic: boolean;
  role: string;
  memberCount: number;
  challengeCount: number;
  createdAt: string;
}

function getGroupAvatarUrl(seed: string | null, name: string): string {
  const s = seed || name || 'default';
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(s)}`;
}

export default function GroupsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups();
    }
  }, [status]);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });
      const data = await res.json();
      if (data.group) {
        setGroups([...groups, { ...data.group, role: 'admin', memberCount: 1, challengeCount: 0 }]);
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', isPublic: false });
        router.push(`/groups/${data.group.id}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreating(false);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/social" className="text-muted-foreground hover:text-foreground">
              ← {t('social')}
            </Link>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createGroup')}
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          {t('myGroups')}
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t('noGroups')}</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createGroup')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/groups/${group.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <img
                            src={getGroupAvatarUrl(group.avatarSeed, group.name)}
                            alt={group.name}
                            className="h-12 w-12 rounded-lg bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate flex items-center gap-2">
                              {group.name}
                              {group.isPublic ? (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">{group.role}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group.memberCount} {t('members')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            {group.challengeCount} {t('challenges')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Group Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl"
              >
                <h2 className="text-xl font-bold mb-4">{t('createGroup')}</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">{t('groupName')}</Label>
                    <Input
                      id="groupName"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder={t('groupName')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDesc">{t('groupDescription')}</Label>
                    <Input
                      id="groupDesc"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder={t('groupDescription')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newGroup.isPublic}
                      onChange={(e) => setNewGroup({ ...newGroup, isPublic: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isPublic">{t('publicGroup')}</Label>
                  </div>
                  <div className="flex gap-2 justify-end mt-6">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup} disabled={creating || !newGroup.name.trim()}>
                      {creating ? 'Creating...' : t('createGroupBtn')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
