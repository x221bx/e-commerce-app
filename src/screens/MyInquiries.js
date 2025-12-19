// src/screens/MyInquiries.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useTheme } from '../theme/useTheme';

// ---- helpers ----
const asMillis = (v) => {
  if (!v) return 0;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const asDate = (v) => {
  if (!v) return new Date();
  if (typeof v?.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const fmtDate = (d) => d?.toLocaleDateString?.() || '';
const fmtTime = (d) => d?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || '';

const safeId = (msg) =>
  msg?.id ||
  `${msg?.sender || msg?.type || 'x'}-${asMillis(msg?.timestamp || msg?.createdAt || msg?.respondedAt)}-${String(
    msg?.message || msg?.body || ''
  ).slice(0, 16)}`;

// ---- rate limiter (fixed: based on recent window) ----
const useRateLimiter = (maxAttempts = 3, windowMs = 60000) => {
  const [attempts, setAttempts] = useState([]);

  const prune = useCallback(() => {
    const now = Date.now();
    setAttempts((prev) => prev.filter((t) => now - t < windowMs));
  }, [windowMs]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    setAttempts((prev) => [...prev.filter((t) => now - t < windowMs), now]);
  }, [windowMs]);

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const recent = attempts.filter((t) => now - t < windowMs);
    return recent.length >= maxAttempts;
  }, [attempts, maxAttempts, windowMs]);

  const getRemainingTime = useCallback(() => {
    const now = Date.now();
    const recent = attempts.filter((t) => now - t < windowMs);
    if (recent.length < maxAttempts) return 0;
    const oldestRecent = Math.min(...recent);
    return Math.ceil((windowMs - (now - oldestRecent)) / 1000);
  }, [attempts, maxAttempts, windowMs]);

  useEffect(() => {
    prune();
  }, []);

  return { recordAttempt, isRateLimited, getRemainingTime };
};

export default function MyInquiries() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const { colors, shadow, mode } = useTheme();
  const isDark = mode === 'dark';
  const isRTL = (i18n?.dir?.() || 'ltr') === 'rtl';

  const rateLimiter = useRateLimiter(3, 60000);

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeId, setActiveId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState('');

  // action states
  const [sending, setSending] = useState(new Set());
  const [closing, setClosing] = useState(new Set());

  const messagesListRef = useRef(null);

  const supportCollection = useMemo(() => collection(db, 'support'), []);
  const legacyComplaintsRef = useMemo(
    () => (user?.uid ? collection(db, 'users', user.uid, 'complaints') : null),
    [user?.uid]
  );

  // --- realtime listeners ---
  useEffect(() => {
    if (!user?.uid) {
      setInquiries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const listUid = [];
    const listUserId = [];
    const listLegacy = [];
    const unsubscribers = [];

    const handleError = (err) => {
      console.error('Error fetching inquiries:', err);
      setError(t('common.error', 'Error'));
      setLoading(false);
    };

    const mergeAndSet = () => {
      const map = new Map();

      const add = (item, source) => {
        if (!item?.id) return;
        const normalized = {
          ...item,
          source, // 'support' | 'legacy'
          userMessages: Array.isArray(item.userMessages) ? item.userMessages : [],
          replies: Array.isArray(item.replies) ? item.replies : [],
        };

        // precedence: support wins over legacy if same id
        const prev = map.get(item.id);
        if (!prev) map.set(item.id, normalized);
        else if (prev.source === 'legacy' && source === 'support') map.set(item.id, { ...prev, ...normalized, source });
        else map.set(item.id, { ...normalized, ...prev });
      };

      listUid.forEach((x) => add(x, 'support'));
      listUserId.forEach((x) => add(x, 'support'));
      listLegacy.forEach((x) => add(x, 'legacy'));

      const merged = Array.from(map.values()).sort((a, b) => {
        const aDate = asMillis(a.updatedAt) || asMillis(a.createdAt);
        const bDate = asMillis(b.updatedAt) || asMillis(b.createdAt);
        return bDate - aDate;
      });

      setInquiries(merged);
      setLoading(false);
    };

    const qUid = query(supportCollection, where('uid', '==', user.uid));
    const qUserId = query(supportCollection, where('userId', '==', user.uid));

    unsubscribers.push(
      onSnapshot(
        qUid,
        (snap) => {
          listUid.splice(0, listUid.length, ...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          mergeAndSet();
        },
        handleError
      )
    );

    unsubscribers.push(
      onSnapshot(
        qUserId,
        (snap) => {
          listUserId.splice(0, listUserId.length, ...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          mergeAndSet();
        },
        handleError
      )
    );

    if (legacyComplaintsRef) {
      unsubscribers.push(
        onSnapshot(
          legacyComplaintsRef,
          (snap) => {
            listLegacy.splice(0, listLegacy.length, ...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            mergeAndSet();
          },
          handleError
        )
      );
    }

    return () => unsubscribers.forEach((u) => u && u());
  }, [supportCollection, legacyComplaintsRef, t, user?.uid]);

  const activeInquiry = useMemo(() => inquiries.find((x) => x.id === activeId) || null, [inquiries, activeId]);

  const docRefFor = useCallback(
    (complaintId, source) => {
      if (source === 'legacy') return doc(db, 'users', user.uid, 'complaints', complaintId);
      return doc(db, 'support', complaintId);
    },
    [user?.uid]
  );

  const buildMessages = useCallback(
    (complaint) => {
      if (!complaint) return [];

      const youName = user?.name || user?.username || user?.email || t('common.you', 'You');
      const adminName = t('common.admin', 'Admin');

      const userMsgs = (Array.isArray(complaint.userMessages) ? complaint.userMessages : []).map((m) => ({
        id: safeId(m),
        kind: 'user',
        sender: 'user',
        userName: m.userName || youName,
        body: m.message || '',
        ts: asDate(m.timestamp || m.createdAt || complaint.createdAt),
      }));

      const replies = (Array.isArray(complaint.replies) ? complaint.replies : []).map((r) => ({
        id: safeId(r),
        kind: 'admin',
        sender: 'admin',
        userName: r.userName || adminName,
        body: r.body || r.message || '',
        ts: asDate(r.createdAt || r.timestamp || complaint.updatedAt || complaint.createdAt),
      }));

      const singleAdmin = complaint.adminResponse
        ? [
            {
              id: `adminResponse-${complaint.id}`,
              kind: 'admin',
              sender: 'admin',
              userName: adminName,
              body: complaint.adminResponse,
              ts: asDate(complaint.respondedAt || complaint.updatedAt || complaint.createdAt),
            },
          ]
        : [];

      const all = [...userMsgs, ...replies, ...singleAdmin]
        .filter((x) => (x.body || '').trim().length > 0)
        .sort((a, b) => a.ts.getTime() - b.ts.getTime());

      return all;
    },
    [t, user?.email, user?.name, user?.username]
  );

  const messages = useMemo(() => buildMessages(activeInquiry), [activeInquiry, buildMessages]);

  const openConversation = useCallback((complaintId) => {
    setActiveId(complaintId);
    setModalVisible(true);
    setDraft('');
  }, []);

  const closeConversation = useCallback(() => {
    setModalVisible(false);
    setDraft('');
  }, []);

  useEffect(() => {
    if (!modalVisible) return;
    const timer = setTimeout(() => {
      try {
        messagesListRef.current?.scrollToEnd?.({ animated: false });
      } catch (e) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [modalVisible, messages.length]);

  const sendFollowUp = useCallback(async () => {
    if (!activeInquiry) return;

    const text = (draft || '').trim();
    if (!text) {
      Alert.alert(t('common.error', 'Error'), t('account.complaints_actions.follow_up_placeholder'));
      return;
    }

    const id = activeInquiry.id;

    try {
      setSending((p) => new Set(p).add(id));

      const newUserMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
        message: text,
        sender: 'user',
        timestamp: new Date(),
      };

      const currentUserMessages = Array.isArray(activeInquiry.userMessages) ? activeInquiry.userMessages : [];

      await updateDoc(docRefFor(id, activeInquiry.source), {
        userMessages: [...currentUserMessages, newUserMessage],
        updatedAt: serverTimestamp(),
      });

      setInquiries((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, userMessages: [...currentUserMessages, newUserMessage], updatedAt: new Date() }
            : c
        )
      );

      setDraft('');
      setTimeout(() => {
        try {
          messagesListRef.current?.scrollToEnd?.({ animated: true });
        } catch (e) {}
      }, 180);
    } catch (err) {
      Alert.alert(t('common.error', 'Error'), err?.message || 'Failed to send follow-up');
    } finally {
      setSending((p) => {
        const cp = new Set(p);
        cp.delete(id);
        return cp;
      });
    }
  }, [activeInquiry, draft, docRefFor, t]);

  const closeComplaint = useCallback(
    async (complaint) => {
      if (!complaint) return;

      if (complaint.status !== 'resolved') {
        Alert.alert(t('common.error', 'Error'), t('account.complaints_actions.wait_for_resolution'));
        return;
      }

      if (rateLimiter.isRateLimited()) {
        const secs = rateLimiter.getRemainingTime();
        Alert.alert(t('common.error', 'Error'), t('common.rateLimitExceeded', { seconds: secs }));
        return;
      }

      const id = complaint.id;

      try {
        rateLimiter.recordAttempt();
        setClosing((p) => new Set(p).add(id));

        await updateDoc(docRefFor(id, complaint.source), {
          status: 'closed',
          closedAt: serverTimestamp(),
          closedBy: 'user',
          updatedAt: serverTimestamp(),
        });

        setInquiries((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, status: 'closed', closedAt: new Date(), closedBy: 'user', updatedAt: new Date() } : c
          )
        );

        Alert.alert(t('common.success', 'Success'), t('account.complaints_actions.complaint_closed'));
      } catch (err) {
        Alert.alert(t('common.error', 'Error'), err?.message || 'Failed to close inquiry');
      } finally {
        setClosing((p) => {
          const cp = new Set(p);
          cp.delete(id);
          return cp;
        });
      }
    },
    [docRefFor, rateLimiter, t]
  );

  const badgeStyle = useCallback(
    (status) => {
      switch (status) {
        case 'pending':
          return { bg: 'rgba(251,191,36,0.18)', fg: '#92400E', icon: 'time-outline' };
        case 'in-progress':
          return { bg: 'rgba(59,130,246,0.18)', fg: '#1D4ED8', icon: 'sync-outline' };
        case 'resolved':
          return { bg: 'rgba(16,185,129,0.18)', fg: '#065F46', icon: 'checkmark-circle-outline' };
        case 'closed':
          return { bg: 'rgba(148,163,184,0.20)', fg: isDark ? '#E2E8F0' : '#0F172A', icon: 'lock-closed-outline' };
        default:
          return { bg: 'rgba(148,163,184,0.20)', fg: isDark ? '#E2E8F0' : '#0F172A', icon: 'help-circle-outline' };
      }
    },
    [isDark]
  );

  const lastMessagePreview = useCallback(
    (complaint) => {
      const msgs = buildMessages(complaint);
      const last = msgs[msgs.length - 1];
      if (!last) return complaint.description || '';
      return String(last.body || '').trim();
    },
    [buildMessages]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(
    ({ item }) => {
      const created = fmtDate(asDate(item.createdAt));
      const updated = asMillis(item.updatedAt) ? fmtDate(asDate(item.updatedAt)) : null;

      const badge = badgeStyle(item.status);
      const preview = lastMessagePreview(item);

      const canClose = item.status === 'resolved';
      const isClosing = closing.has(item.id);

      return (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, shadowColor: shadow.color },
          ]}
        >
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.topicLabel, { color: colors.primary }]}>
                {t('account.complaints_topic_fallback')}
              </Text>

              <Text style={[styles.topic, { color: colors.text }]} numberOfLines={1}>
                {t(
                  item.topic ? `account.complaints_topics.${item.topic}` : 'account.complaints_topic_fallback',
                  item.topic || 'General support'
                )}
              </Text>

              {!!preview && (
                <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={2}>
                  {preview}
                </Text>
              )}
            </View>

            <View style={{ alignItems: 'flex-end', gap: 8, minWidth: 116 }}>
              <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                <Ionicons name={badge.icon} size={14} color={badge.fg} />
                <Text style={[styles.statusText, { color: badge.fg }]}>
                  {t(`account.complaints_status.${item.status}`, item.status || 'Pending')}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                  {updated ? `${created} • ${t('common.updated', 'Updated')} ${updated}` : created}
                </Text>
              </View>
            </View>
          </View>

          {/* ✅ FIX: bottom section becomes 2 rows (prevents buttons overflow) */}
          <View style={styles.cardBottom}>
            <View style={styles.bottomRow}>
              <View style={[styles.phoneChip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="call-outline" size={16} color="#EC4899" />
                <Text style={[styles.metaText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {item.phoneNumber || item.phone || t('account.complaints.phone_placeholder')}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => openConversation(item.id)}
              >
                <Ionicons name="chatbubbles-outline" size={16} color={colors.text} />
                <Text style={[styles.btnSecondaryText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {t('account.complaint_fields.conversation', 'Conversation')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  { backgroundColor: colors.primary, opacity: canClose ? (isClosing ? 0.65 : 1) : 0.5 },
                ]}
                onPress={() => closeComplaint(item)}
                disabled={!canClose || isClosing}
              >
                <Ionicons name="lock-closed-outline" size={16} color={colors.surface} />
                <Text style={[styles.btnPrimaryText, { color: colors.surface }]} numberOfLines={1} ellipsizeMode="tail">
                  {isClosing ? t('account.complaints_actions.closing') : t('account.complaints_actions.close_complaint')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [badgeStyle, buildMessages, closeComplaint, closing, colors, lastMessagePreview, openConversation, shadow.color, t]
  );

  const ConversationBubble = useCallback(
    ({ msg, prevMsg }) => {
      const isAdmin = msg.sender === 'admin' || msg.kind === 'admin';

      const accent = isAdmin ? '#10B981' : colors.primary;
      const bubbleBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
      const border = colors.border;

      const sameDay = prevMsg && fmtDate(prevMsg.ts) === fmtDate(msg.ts);
      const showDayHeader = !prevMsg || !sameDay;
      const showAvatar = !prevMsg || prevMsg.sender !== msg.sender;

      const alignRow = isAdmin ? 'flex-start' : 'flex-end';

      return (
        <View style={{ marginTop: showDayHeader ? 14 : 8 }}>
          {showDayHeader ? (
            <View style={styles.dayHeaderWrap}>
              <View style={[styles.dayHeaderPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.dayHeaderText, { color: colors.textMuted }]}>{fmtDate(msg.ts)}</Text>
              </View>
            </View>
          ) : null}

          <View style={{ alignItems: alignRow }}>
            <View style={{ flexDirection: isAdmin ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 10 }}>
              <View style={{ width: 34, alignItems: 'center', justifyContent: 'center' }}>
                {showAvatar ? (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isAdmin
                          ? isDark
                            ? '#064E3B'
                            : '#BBF7D0'
                          : isDark
                          ? '#1E3A8A'
                          : '#DBEAFE',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight: '800',
                        color: isAdmin ? (isDark ? '#D1FAE5' : '#065F46') : isDark ? '#DBEAFE' : '#1D4ED8',
                      }}
                    >
                      {(msg.userName || (isAdmin ? 'A' : 'U'))
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: 34, height: 34 }} />
                )}
              </View>

              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: bubbleBg,
                    borderColor: border,
                    alignSelf: alignRow,
                    borderLeftWidth: isAdmin ? 3 : 1,
                    borderRightWidth: isAdmin ? 1 : 3,
                    borderLeftColor: isAdmin ? accent : border,
                    borderRightColor: !isAdmin ? accent : border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    lineHeight: 20,
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {msg.body}
                </Text>

                <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={[styles.bubbleMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    {msg.userName || ''}
                  </Text>
                  <Text style={[styles.bubbleMeta, { color: colors.textMuted }]}>{fmtTime(msg.ts)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [colors, isDark, isRTL]
  );

  const renderMessage = useCallback(
    ({ item, index }) => {
      const prev = index > 0 ? messages[index - 1] : null;
      return <ConversationBubble msg={item} prevMsg={prev} />;
    },
    [ConversationBubble, messages]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconBtn, { backgroundColor: colors.card, shadowColor: shadow.color }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t('account.complaints_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.headerWrap}>
        <View
          style={[
            styles.heroIcon,
            { backgroundColor: isDark ? 'rgba(11,163,77,0.22)' : 'rgba(11,163,77,0.12)' },
          ]}
        >
          <Ionicons name="notifications-outline" size={26} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('account.complaints_title')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{t('account.complaints_subtitle')}</Text>
      </View>

      {loading ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : !inquiries.length ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('account.no_complaints_title')}</Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>{t('account.no_complaints_subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Conversation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeConversation}>
        <Pressable style={styles.modalBackdrop} onPress={closeConversation} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                {t('account.complaint_fields.conversation', 'Conversation')}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]} numberOfLines={1}>
                {activeInquiry
                  ? t(
                      activeInquiry.topic
                        ? `account.complaints_topics.${activeInquiry.topic}`
                        : 'account.complaints_topic_fallback',
                      activeInquiry.topic || 'General support'
                    )
                  : ''}
              </Text>
            </View>

            <TouchableOpacity
              onPress={closeConversation}
              style={[styles.modalCloseBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={messagesListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14 }}
            onContentSizeChange={() => {
              try {
                messagesListRef.current?.scrollToEnd?.({ animated: false });
              } catch (e) {}
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ padding: 18 }}>
                <Text style={{ color: colors.textMuted }}>{t('account.no_messages', 'No messages yet')}</Text>
              </View>
            }
          />

          {activeInquiry?.status !== 'closed' ? (
            <View style={[styles.composerWrap, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.composerBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t('account.complaints_actions.follow_up_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={[
                    styles.composerInput,
                    {
                      color: colors.text,
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={sendFollowUp}
                  disabled={sending.has(activeInquiry?.id) || !draft.trim()}
                  style={[
                    styles.sendBtn,
                    { backgroundColor: colors.primary, opacity: sending.has(activeInquiry?.id) || !draft.trim() ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons name="send" size={18} color={colors.surface} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.composerHint, { color: colors.textMuted }]}>
                {t('account.follow_up_hint', 'Your message will be added to this inquiry.')}
              </Text>
            </View>
          ) : (
            <View style={[styles.closedHintWrap, { borderTopColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted }}>{t('account.closed_conversation', 'This inquiry is closed.')}</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  topTitle: { fontSize: 16, fontWeight: '800' },

  headerWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  heroIcon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  headerTitle: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginTop: 10 },
  headerSubtitle: { textAlign: 'center', fontSize: 13, marginTop: 6, paddingHorizontal: 10 },

  stateCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, elevation: 2 },
  helperText: { fontSize: 12, marginTop: 4 },
  errorText: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '900' },

  card: { borderRadius: 16, padding: 14, borderWidth: 1, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 12 },
  topicLabel: { fontSize: 11, letterSpacing: 1, fontWeight: '800' },
  topic: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  preview: { fontSize: 13, marginTop: 6, lineHeight: 18 },

  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },

  /* ✅ FIXED LAYOUT */
  cardBottom: { marginTop: 14, gap: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '100%',
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 140,
  },
  btnSecondaryText: { fontWeight: '800', fontSize: 12 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 140,
  },
  btnPrimaryText: { fontWeight: '900', fontSize: 12 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '86%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: '900' },
  modalSub: { fontSize: 12, marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  dayHeaderWrap: { alignItems: 'center' },
  dayHeaderPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  dayHeaderText: { fontSize: 12, fontWeight: '700' },

  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  bubbleMeta: { fontSize: 11, fontWeight: '700' },

  composerWrap: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  composerBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderWidth: 1, borderRadius: 14, padding: 10 },
  composerInput: { flex: 1, minHeight: 44, maxHeight: 110, fontSize: 14, lineHeight: 20 },
  sendBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  composerHint: { fontSize: 11, marginTop: 8 },

  closedHintWrap: { borderTopWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
