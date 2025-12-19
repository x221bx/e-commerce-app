import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
  Modal,
  Pressable,
  Image,
  KeyboardAvoidingView,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useAIChat } from "../../hooks/useAIChat";
import { getLocalizedName } from "../../utils/productLocalization";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { addToCart } from "../../features/cart/cartSlice";
import { db } from "../../services/firebase";
import { UseTheme } from "../../theme/ThemeProvider";

const HISTORY_KEY = "chatHistory";
const QUICK_REPLIES = [
  "Where is my order?",
  "I need support",
  "Recommend a product",
  "Reset password",
];

const sanitizeText = (val) => {
  if (typeof val !== "string") return val;
  return val
    .replace(/\[respond in [^\]]+\]\s*/gi, "")
    .replace(/\[.*respond.*?\]/gi, "")
    .replace(/respond in (arabic|english)[:\s]*/gi, "")
    .trim();
};

// ------------------------------------------------------
// Mini Product Card
// ------------------------------------------------------
const ProductCardMini = ({ id, isDark, onPress, onAdd }) => {
  const [product, setProduct] = useState(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists() && mounted) setProduct({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Failed to load product", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!product) {
    return (
      <View style={[styles.productCard, styles.productCardSkeleton]}>
        <Text style={styles.skeletonText}>Loading product...</Text>
      </View>
    );
  }

  const imageUrl =
    product.heroImage ||
    product.imageUrl ||
    product.thumbnailUrl ||
    product.image ||
    product.photo ||
    null;

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        isDark ? styles.productCardDark : styles.productCardLight,
      ]}
      onPress={() => onPress?.(product)}
      activeOpacity={0.9}
    >
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.productImage} />}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, isDark && styles.textLight]} numberOfLines={2}>
          {getLocalizedName(product, i18n.language)}
        </Text>
        <Text style={[styles.productPrice, isDark && styles.textLight]}>
          {product.price ? `${product.price} EGP` : ""}
        </Text>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(product)}>
        <Ionicons name="cart-outline" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ------------------------------------------------------
// Main ChatBot Component
// ------------------------------------------------------
export default function ChatBot({ hidden = false }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { messages, sendMessage, setMessages } = useAIChat();
  const user = useSelector(selectCurrentUser);

  const themeCtx = UseTheme?.();
  const theme = themeCtx?.theme || "light";
  const isDark = theme === "dark";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const fabBottom = 92;
  const fabRight = 18;

  if (hidden) return null;

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved).map((m) => ({
            ...m,
            content: sanitizeText(m.content),
          }));
          setMessages(parsed);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    })();
  }, [setMessages]);

  useEffect(() => {
    const cleaned = messages.map((m) => ({
      ...m,
      content: sanitizeText(m.content),
    }));
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(cleaned)).catch(() => {});
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && !open) setUnread((u) => u + 1);

    messagesEndRef.current?.scrollToEnd({ animated: true });
  }, [messages, open]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (open) {
        closeSheet();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [open]);

  const openSheet = () => {
    setOpen(true);
    setUnread(0);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 230,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
      setMenuOpen(false);
    });
  };

  const handleSend = async (overrideText) => {
    const textToSend = sanitizeText(overrideText ?? input?.trim())?.trim() || "";

    if (!textToSend) return;

    setTyping(true);
    try {
      await sendMessage(textToSend);
      if (!overrideText) setInput("");
    } finally {
      setTyping(false);
    }
  };

  const handleAddToCart = (product) => dispatch(addToCart(product));

  const renderMessage = (raw) => {
    const text = sanitizeText(raw);
    if (typeof text !== "string") return text;

    const cardRegex = /<productcard\s+id=['"]([^'"]+)['"][^>]*\/?>/gi;
    const parts = [];
    const seen = new Set();
    let lastIndex = 0;
    let match;

    while ((match = cardRegex.exec(text)) !== null && seen.size < 3) {
      let before = text.substring(lastIndex, match.index);
      before = before.replace(/<\/?productcard[^>]*>/gi, "").trim();
      if (before && !/^[-�?"]?\s*$/.test(before)) {
        parts.push(
          <Text key={`txt-${lastIndex}`} style={styles.messageText}>
            {before}
          </Text>
        );
      }

      const productId = match[1];
      if (!seen.has(productId)) {
        seen.add(productId);
        parts.push(
          <ProductCardMini
            key={`card-${productId}-${match.index}`}
            id={productId}
            isDark={isDark}
            onPress={(p) => navigation.navigate("ProductDetails", { product: p })}
            onAdd={handleAddToCart}
          />
        );
      }

      lastIndex = cardRegex.lastIndex;
    }

    const after = text.substring(lastIndex).replace(/<\/?productcard[^>]*>/gi, "").trim();
    if (after && !/^[-�?"]?\s*$/.test(after)) {
      parts.push(
        <Text key={`txt-end-${lastIndex}`} style={styles.messageText}>
          {after}
        </Text>
      );
    }

    return parts;
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: fabBottom,
            right: fabRight,
            backgroundColor: isDark ? "#0EA5E9" : "#0BA34D",
          },
          Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
            },
            android: { elevation: 8 },
          }),
        ]}
        onPress={openSheet}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={closeSheet} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY: sheetAnim }],
                backgroundColor: isDark ? "#0c1617" : "#FFFFFF",
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                { backgroundColor: isDark ? "#0EA5E9" : "#0BA34D" },
              ]}
            >
              <View style={styles.headerTitle}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={styles.headerText}>AI Assistant</Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setSoundEnabled((v) => !v)} style={styles.iconBtn}>
                  <Ionicons
                    name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMenuOpen((p) => !p)} style={styles.iconBtn}>
                  <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={closeSheet} style={styles.iconBtn}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu */}
            {menuOpen && (
              <View style={styles.menu}>
                <TouchableOpacity
                  onPress={() => {
                    setMessages([]);
                    AsyncStorage.removeItem(HISTORY_KEY);
                    setMenuOpen(false);
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                  <Text style={styles.menuText}>Clear chat</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Scrollable Messages */}
            <View style={styles.messagesContainer}>
              <ScrollView
                ref={messagesEndRef}
                style={[styles.messages, isDark ? styles.messagesDark : styles.messagesLight]}
                contentContainerStyle={{
                  padding: 12,
                  gap: 10,
                  flexGrow: 1,
                }}
              >
                {messages.map((m, i) => (
                  <View
                    key={m.id || i}
                    style={[
                      styles.bubbleWrapper,
                      m.role === "user" ? styles.bubbleUser : styles.bubbleBot,
                    ]}
                  >
                    <View style={styles.meta}>
                      <Text style={styles.metaText}>{m.role === "user" ? "You" : "AI"}</Text>
                    </View>

                    <View
                      style={[
                        styles.bubble,
                        m.role === "user"
                          ? styles.bubbleUserBg
                          : isDark
                          ? styles.bubbleBotDark
                          : styles.bubbleBotLight,
                      ]}
                    >
                      {renderMessage(m.content)}
                    </View>
                  </View>
                ))}

                {typing && (
                  <View style={styles.typing}>
                    <Text style={styles.metaText}>Typing...</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Quick Replies */}
            {messages.length === 0 && (
              <View style={styles.quickContainer}>
                <Text style={styles.quickTitle}>Quick start</Text>
                <View style={styles.quickRow}>
                  {QUICK_REPLIES.map((reply, idx) => (
                    <TouchableOpacity key={idx} onPress={() => handleSend(reply)} style={styles.quickChip}>
                      <Text style={styles.quickText}>{reply}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
                placeholderTextColor="#94A3B8"
                style={[styles.input, isDark && styles.inputDark]}
                multiline
              />

              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={!input.trim()}
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ------------------------------------------------------
// Styles
// ------------------------------------------------------
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },

  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Dimensions.get("window").height * 0.65,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },

  headerText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 6 },

  menu: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
  },

  menuText: { fontSize: 13, color: "#DC2626", fontWeight: "700" },

  messagesContainer: {
    flex: 1,
    minHeight: 120,
  },

  messages: {
    flexGrow: 1,
  },

  messagesLight: {
    backgroundColor: "#F8FAFC",
  },

  messagesDark: {
    backgroundColor: "#0b1b1b",
  },

  bubbleWrapper: { gap: 6 },

  bubbleUser: { alignItems: "flex-end" },

  bubbleBot: { alignItems: "flex-start" },

  meta: { flexDirection: "row", gap: 8 },

  metaText: { fontSize: 10, color: "#94A3B8" },

  bubble: {
    padding: 10,
    borderRadius: 14,
    maxWidth: "90%",
    gap: 6,
  },

  bubbleUserBg: {
    backgroundColor: "#0BA34D",
    borderTopRightRadius: 6,
  },

  bubbleBotLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderTopLeftRadius: 6,
  },

  bubbleBotDark: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderTopLeftRadius: 6,
  },

  messageText: { color: "#0F172A", fontSize: 13, lineHeight: 19 },

  typing: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    alignSelf: "flex-start",
  },

  quickContainer: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },

  quickTitle: { fontSize: 12, fontWeight: "700", color: "#0F172A" },

  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },

  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ECFDF3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },

  quickText: { color: "#047857", fontWeight: "700", fontSize: 12 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    minHeight: 44,
  },

  inputDark: {
    backgroundColor: "#0f172a",
    color: "#E2E8F0",
    borderColor: "#1f2937",
  },

  sendBtn: {
    backgroundColor: "#0BA34D",
    borderRadius: 12,
    padding: 10,
  },

  sendBtnDisabled: { backgroundColor: "#CBD5E1" },

  productCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 6,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
  },

  productCardLight: { backgroundColor: "#fff", borderColor: "#E2E8F0" },

  productCardDark: { backgroundColor: "#0f172a", borderColor: "#1f2937" },

  productCardSkeleton: { backgroundColor: "#E2E8F0", borderColor: "#E2E8F0" },

  skeletonText: { fontSize: 12, color: "#475569" },

  productImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },

  productInfo: { flex: 1, gap: 4 },

  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  productPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },

  addBtn: {
    backgroundColor: "#0BA34D",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  textLight: { color: "#E2E8F0" },
});
