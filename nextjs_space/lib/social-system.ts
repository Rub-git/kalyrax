import prisma from './db';

// Types for social system
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type GroupRole = 'admin' | 'member';
export type ActivityEventType = 'CHALLENGE_STARTED' | 'DAY_COMPLETED' | 'STREAK_MILESTONE' | 'CHALLENGE_COMPLETED';
export type NotificationType = 'FRIEND_REQUEST' | 'FRIEND_COMPLETED_DAY' | 'REACTION_RECEIVED' | 'LEADERBOARD_PASSED' | 'GROUP_INVITE';
export type ReactionType = 'fire' | 'muscle' | 'clap';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  fire: '🔥',
  muscle: '💪',
  clap: '👏',
};

// ============== FRIENDS SYSTEM ==============

export async function searchUsers(query: string, currentUserId: string, limit = 20) {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        {
          profile: {
            allowFriendRequests: true,
            socialEnabled: true,
          },
        },
      ],
    },
    include: {
      profile: {
        select: {
          displayName: true,
          avatarSeed: true,
        },
      },
    },
    take: limit,
  });

  // Get existing friendships for these users
  const userIds = users.map(u => u.id);
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId: currentUserId, friendId: { in: userIds } },
        { userId: { in: userIds }, friendId: currentUserId },
      ],
    },
  });

  return users.map(user => {
    const friendship = friendships.find(
      f => (f.userId === currentUserId && f.friendId === user.id) ||
           (f.friendId === currentUserId && f.userId === user.id)
    );
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      displayName: user.profile?.displayName,
      avatarSeed: user.profile?.avatarSeed,
      friendshipStatus: friendship?.status || null,
      friendshipId: friendship?.id || null,
      isPendingFromMe: friendship?.userId === currentUserId && friendship?.status === 'pending',
    };
  });
}

export async function sendFriendRequest(userId: string, friendId: string) {
  // Check if friendship already exists
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'blocked') {
      throw new Error('Cannot send friend request');
    }
    return existing;
  }

  const friendship = await prisma.friendship.create({
    data: {
      userId,
      friendId,
      status: 'pending',
    },
  });

  // Create notification for the recipient
  const sender = await prisma.user.findUnique({ where: { id: userId } });
  await createNotification(friendId, 'FRIEND_REQUEST', {
    title: 'New Friend Request',
    message: `${sender?.name || 'Someone'} wants to be your friend!`,
    referenceId: friendship.id,
  });

  return friendship;
}

export async function acceptFriendRequest(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      friendId: userId,
      status: 'pending',
    },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'accepted' },
  });
}

export async function rejectFriendRequest(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      friendId: userId,
      status: 'pending',
    },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  return prisma.friendship.delete({
    where: { id: friendshipId },
  });
}

export async function removeFriend(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      OR: [
        { userId },
        { friendId: userId },
      ],
    },
  });

  if (!friendship) {
    throw new Error('Friendship not found');
  }

  return prisma.friendship.delete({
    where: { id: friendshipId },
  });
}

export async function blockUser(userId: string, userToBlockId: string) {
  // Find existing friendship or create a new blocked one
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId: userToBlockId },
        { userId: userToBlockId, friendId: userId },
      ],
    },
  });

  if (existing) {
    return prisma.friendship.update({
      where: { id: existing.id },
      data: { status: 'blocked', userId, friendId: userToBlockId },
    });
  }

  return prisma.friendship.create({
    data: {
      userId,
      friendId: userToBlockId,
      status: 'blocked',
    },
  });
}

export async function getFriendsList(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [
        { userId },
        { friendId: userId },
      ],
    },
    include: {
      user: {
        include: {
          profile: {
            select: {
              displayName: true,
              avatarSeed: true,
            },
          },
          userStreak: {
            select: {
              currentStreak: true,
            },
          },
        },
      },
      friend: {
        include: {
          profile: {
            select: {
              displayName: true,
              avatarSeed: true,
            },
          },
          userStreak: {
            select: {
              currentStreak: true,
            },
          },
        },
      },
    },
  });

  return friendships.map(f => {
    const friend = f.userId === userId ? f.friend : f.user;
    return {
      friendshipId: f.id,
      id: friend.id,
      name: friend.name,
      displayName: friend.profile?.displayName,
      avatarSeed: friend.profile?.avatarSeed,
      currentStreak: friend.userStreak?.currentStreak || 0,
      createdAt: f.createdAt,
    };
  });
}

export async function getPendingRequests(userId: string) {
  const requests = await prisma.friendship.findMany({
    where: {
      friendId: userId,
      status: 'pending',
    },
    include: {
      user: {
        include: {
          profile: {
            select: {
              displayName: true,
              avatarSeed: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map(r => ({
    friendshipId: r.id,
    id: r.user.id,
    name: r.user.name,
    displayName: r.user.profile?.displayName,
    avatarSeed: r.user.profile?.avatarSeed,
    createdAt: r.createdAt,
  }));
}

// ============== GROUPS SYSTEM ==============

export async function createGroup(ownerId: string, name: string, description?: string, isPublic = false) {
  const group = await prisma.group.create({
    data: {
      name,
      description,
      ownerId,
      isPublic,
      avatarSeed: Math.random().toString(36).substring(7),
    },
  });

  // Add owner as admin member
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: ownerId,
      role: 'admin',
    },
  });

  return group;
}

export async function getGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
              challenges: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map(m => ({
    ...m.group,
    role: m.role,
    joinedAt: m.joinedAt,
    memberCount: m.group._count.members,
    challengeCount: m.group._count.challenges,
  }));
}

export async function getGroupDetails(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true, avatarSeed: true } },
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { displayName: true, avatarSeed: true } },
              userStreak: { select: { currentStreak: true } },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      challenges: {
        where: { status: 'active' },
        include: {
          template: true,
          _count: { select: { participants: true } },
        },
        orderBy: { startDate: 'desc' },
      },
    },
  });

  if (!group) return null;

  const userMembership = group.members.find(m => m.userId === userId);

  return {
    ...group,
    isMember: !!userMembership,
    userRole: userMembership?.role || null,
  };
}

export async function inviteToGroup(groupId: string, inviterId: string, friendId: string) {
  // Verify inviter has permission
  const inviterMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: inviterId },
    },
  });

  if (!inviterMembership) {
    throw new Error('You are not a member of this group');
  }

  // Check if user is already a member
  const existingMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: friendId },
    },
  });

  if (existingMembership) {
    throw new Error('User is already a member');
  }

  // Add as member
  await prisma.groupMember.create({
    data: {
      groupId,
      userId: friendId,
      role: 'member',
    },
  });

  // Notify the invited user
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  const inviter = await prisma.user.findUnique({ where: { id: inviterId } });
  await createNotification(friendId, 'GROUP_INVITE', {
    title: 'Group Invitation',
    message: `${inviter?.name || 'Someone'} added you to ${group?.name}!`,
    referenceId: groupId,
  });

  return true;
}

export async function joinGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group || !group.isPublic) {
    throw new Error('Group not found or is private');
  }

  const existing = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (existing) {
    throw new Error('Already a member');
  }

  return prisma.groupMember.create({
    data: {
      groupId,
      userId,
      role: 'member',
    },
  });
}

export async function leaveGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (group?.ownerId === userId) {
    throw new Error('Owner cannot leave the group');
  }

  return prisma.groupMember.delete({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
}

// ============== GROUP CHALLENGES ==============

export async function createGroupChallenge(
  groupId: string,
  creatorId: string,
  templateId: string,
  startDate: Date
) {
  // Verify creator is a member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: creatorId },
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this group');
  }

  const template = await prisma.challengeTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Challenge template not found');
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + template.durationDays);

  const challenge = await prisma.groupChallenge.create({
    data: {
      groupId,
      templateId,
      startDate,
      endDate,
      createdBy: creatorId,
    },
  });

  // Auto-join creator
  await prisma.groupChallengeParticipant.create({
    data: {
      groupChallengeId: challenge.id,
      userId: creatorId,
    },
  });

  return challenge;
}

export async function joinGroupChallenge(challengeId: string, userId: string) {
  const challenge = await prisma.groupChallenge.findUnique({
    where: { id: challengeId },
    include: { group: true },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Verify user is a group member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: challenge.groupId, userId },
    },
  });

  if (!membership) {
    throw new Error('You must be a group member to join');
  }

  const existing = await prisma.groupChallengeParticipant.findUnique({
    where: {
      groupChallengeId_userId: { groupChallengeId: challengeId, userId },
    },
  });

  if (existing) {
    throw new Error('Already participating');
  }

  return prisma.groupChallengeParticipant.create({
    data: {
      groupChallengeId: challengeId,
      userId,
    },
  });
}

export async function updateGroupChallengeProgress(
  challengeId: string,
  userId: string,
  points: number
) {
  const participant = await prisma.groupChallengeParticipant.findUnique({
    where: {
      groupChallengeId_userId: { groupChallengeId: challengeId, userId },
    },
  });

  if (!participant) {
    return null;
  }

  return prisma.groupChallengeParticipant.update({
    where: { id: participant.id },
    data: {
      progressDays: { increment: 1 },
      streak: { increment: 1 },
      points: { increment: points },
    },
  });
}

export async function getGroupChallengeLeaderboard(challengeId: string) {
  const participants = await prisma.groupChallengeParticipant.findMany({
    where: { groupChallengeId: challengeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true, avatarSeed: true } },
        },
      },
    },
    orderBy: [{ points: 'desc' }, { streak: 'desc' }],
  });

  return participants.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    name: p.user.name,
    displayName: p.user.profile?.displayName,
    avatarSeed: p.user.profile?.avatarSeed,
    progressDays: p.progressDays,
    streak: p.streak,
    points: p.points,
  }));
}

// ============== ACTIVITY FEED ==============

export async function createActivityFeedEvent(
  userId: string,
  eventType: ActivityEventType,
  referenceId?: string,
  metadata?: Record<string, unknown>
) {
  // Check if user has social enabled
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile?.socialEnabled || !profile?.showActivityToFriends) {
    return null;
  }

  return prisma.activityFeed.create({
    data: {
      userId,
      eventType,
      referenceId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

export async function getFriendsActivityFeed(userId: string, limit = 50) {
  // Get friends list
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [
        { userId },
        { friendId: userId },
      ],
    },
  });

  const friendIds = friendships.map(f =>
    f.userId === userId ? f.friendId : f.userId
  );

  // Include user's own activities
  friendIds.push(userId);

  const activities = await prisma.activityFeed.findMany({
    where: {
      userId: { in: friendIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true, avatarSeed: true } },
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return activities.map(a => ({
    ...a,
    userReaction: a.reactions.find(r => r.userId === userId)?.reactionType || null,
    reactionCounts: {
      fire: a.reactions.filter(r => r.reactionType === 'fire').length,
      muscle: a.reactions.filter(r => r.reactionType === 'muscle').length,
      clap: a.reactions.filter(r => r.reactionType === 'clap').length,
    },
  }));
}

// ============== REACTIONS ==============

export async function addReaction(activityId: string, userId: string, reactionType: ReactionType) {
  // Check if reaction already exists
  const existing = await prisma.activityReaction.findUnique({
    where: {
      activityId_userId: { activityId, userId },
    },
  });

  if (existing) {
    // Update reaction type
    return prisma.activityReaction.update({
      where: { id: existing.id },
      data: { reactionType },
    });
  }

  const reaction = await prisma.activityReaction.create({
    data: {
      activityId,
      userId,
      reactionType,
    },
  });

  // Notify activity owner
  const activity = await prisma.activityFeed.findUnique({
    where: { id: activityId },
  });

  if (activity && activity.userId !== userId) {
    const reactor = await prisma.user.findUnique({ where: { id: userId } });
    await createNotification(activity.userId, 'REACTION_RECEIVED', {
      title: 'New Reaction',
      message: `${reactor?.name || 'Someone'} reacted ${REACTION_EMOJIS[reactionType]} to your activity!`,
      referenceId: activityId,
    });
  }

  return reaction;
}

export async function removeReaction(activityId: string, userId: string) {
  return prisma.activityReaction.delete({
    where: {
      activityId_userId: { activityId, userId },
    },
  });
}

// ============== NOTIFICATIONS ==============

export async function createNotification(
  userId: string,
  type: NotificationType,
  data: { title: string; message: string; referenceId?: string }
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title: data.title,
      message: data.message,
      referenceId: data.referenceId,
    },
  });
}

export async function getNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

// ============== NOTIFY FRIENDS HELPERS ==============

export async function notifyFriendsOfProgress(userId: string, eventType: ActivityEventType, metadata?: Record<string, unknown>) {
  // Get friends who should receive notifications
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [
        { userId },
        { friendId: userId },
      ],
    },
    include: {
      user: { include: { profile: true } },
      friend: { include: { profile: true } },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const userName = user?.name || 'A friend';

  const messageMap: Record<ActivityEventType, string> = {
    CHALLENGE_STARTED: `${userName} started a new challenge!`,
    DAY_COMPLETED: `${userName} completed a challenge day!`,
    STREAK_MILESTONE: `${userName} reached a streak milestone!`,
    CHALLENGE_COMPLETED: `${userName} completed a challenge! 🎉`,
  };

  for (const friendship of friendships) {
    const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
    const friend = friendship.userId === userId ? friendship.friend : friendship.user;

    if (friend.profile?.socialEnabled) {
      await createNotification(friendId, 'FRIEND_COMPLETED_DAY', {
        title: 'Friend Activity',
        message: messageMap[eventType],
        referenceId: userId,
      });
    }
  }
}
