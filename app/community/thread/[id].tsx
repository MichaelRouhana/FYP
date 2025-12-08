import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, View } from 'react-native';
import { Avatar, Text, TextInput } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const initial = [
  { id: '1', user: 'Alex', text: 'Great match today!', time: '10:21' },
  { id: '2', user: 'Priya', text: 'Defense was solid.', time: '10:22' },
];

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [comments, setComments] = useState(initial);
  const [message, setMessage] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    const newMsg = { id: String(Date.now()), user: 'You', text, time: 'now' };
    setComments((c) => [...c, newMsg]);
    setMessage('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
          <FlatList
            ref={listRef}
            contentContainerStyle={{ padding: 12, paddingBottom: 12 }}
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                item={item}
                isMe={item.user === 'You'}
                colorScheme={colorScheme}
              />
            )}
          />
          <View style={{ padding: 8}}>
            <TextInput
              mode="outlined"
              style={{ borderRadius: 24 }}
              value={message}
              onChangeText={setMessage}
              placeholder={`Message ${id}`}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              right={<TextInput.Icon icon="send" onPress={handleSend} disabled={!message.trim()} />}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ item, isMe, colorScheme }: { item: { id: string; user: string; text: string; time: string }; isMe: boolean; colorScheme: 'light' | 'dark' }) {
  const outgoingBg = Colors[colorScheme].tint; // brand green
  const incomingBg = colorScheme === 'dark' ? '#1f2937' : '#f3f4f6';
  const incomingBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
  const outgoingText = '#ffffff';
  const incomingText = colorScheme === 'dark' ? '#e5e7eb' : '#0b0f1a';

  return (
    <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', marginVertical: 6 }}>
      {!isMe && (
        <View style={{ marginRight: 8 }}>
          <Avatar.Text label={item.user[0]} size={28} />
        </View>
      )}
      <View
        style={{
          maxWidth: '78%',
          backgroundColor: isMe ? outgoingBg : incomingBg,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderBottomRightRadius: isMe ? 4 : 16,
          borderBottomLeftRadius: isMe ? 16 : 4,
          borderWidth: isMe ? 0 : 1,
          borderColor: isMe ? 'transparent' : incomingBorder,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        {!isMe && (
          <Text variant="labelSmall" style={{ marginBottom: 2, opacity: 0.8, color: incomingText }}>{item.user}</Text>
        )}
        <Text variant="bodyMedium" style={{ color: isMe ? outgoingText : incomingText }}>{item.text}</Text>
        <Text variant="labelSmall" style={{ alignSelf: 'flex-end', marginTop: 6, opacity: isMe ? 0.9 : 0.6, color: isMe ? 'rgba(255,255,255,0.9)' : incomingText }}>{item.time}</Text>
      </View>
    </View>
  );
}


