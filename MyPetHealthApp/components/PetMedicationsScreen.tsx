// components/PetMedicationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
  Linking,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pet } from '../src/types';
import { useAuth } from '../src/hooks/AuthContext';
import { AppScreen } from '../src/types/navigation';
import BottomNav from './BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';

const BASE_URL = 'http://192.168.0.59:3001';

const cardBg = require('../assets/images/ФонГлавБел.jpg');

const COLORS = {
  background: '#FFFFFF',
  white: '#FFFFFF',
  cardSoft: '#FFE8E1',
  text: '#202020',
  textSoft: '#6F6578',
  accent: '#C9A7FF',
  accentDark: '#A984E8',
  coral: '#FF7A6B',
  coralDark: '#E95F53',
  border: '#EADDF8',
  shadow: '#8E78A8',
  success: '#65B891',
  warning: '#F4B740',
  blue: '#7FA7FF',
};

interface PetMedicationsScreenProps {
  pets: Pet[];
  onBack: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

interface CalendarEvent {
  id: string;
  petId: number;
  petName?: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: 'vaccination' | 'deworming' | 'vet_visit' | 'reminder';
  reminderMinutes?: number;
  syncedToPhone: boolean;
}

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const EVENT_COLORS = {
  vaccination: COLORS.success,
  deworming: COLORS.warning,
  vet_visit: COLORS.coral,
  reminder: COLORS.accent,
};

const EVENT_ICONS = {
  vaccination: 'medical-outline',
  deworming: 'bug-outline',
  vet_visit: 'medkit-outline',
  reminder: 'notifications-outline',
} as const;

const EVENT_LABELS = {
  vaccination: 'Прививка',
  deworming: 'Глистогонка',
  vet_visit: 'Визит к врачу',
  reminder: 'Напоминание',
};

const PetMedicationsScreen: React.FC<PetMedicationsScreenProps> = ({
  pets,
  onBack,
  onNavigate,
}) => {
  const { user } = useAuth();

  const [selectedPet, setSelectedPet] = useState<Pet | null>(pets[0] || null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalVisible, setModalVisible] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] =
    useState<CalendarEvent['type']>('reminder');
  const [newEventPetId, setNewEventPetId] = useState<number | null>(
    selectedPet?.id || null
  );
  const [newEventTime, setNewEventTime] = useState('12:00');
  const [newEventReminder, setNewEventReminder] = useState(true);
  const [exportToPhone, setExportToPhone] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);

  useEffect(() => {
    checkCalendarPermission();
  }, []);

  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      setSelectedPet(pets[0]);
      setNewEventPetId(pets[0].id);
    }
  }, [pets, selectedPet]);

  useEffect(() => {
    if (selectedPet) {
      loadEvents();
      setNewEventPetId(selectedPet.id);
    }
  }, [selectedPet]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate]);

  const checkCalendarPermission = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setCalendarPermission(status === 'granted');
  };

  const loadEvents = async () => {
    if (!selectedPet) return;

    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        `${BASE_URL}/api/calendar/events?petId=${selectedPet.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: Date[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;

    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    setCalendarDays(days);
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((e) => e.date === dateStr);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const exportToSystemCalendar = async (event: CalendarEvent) => {
    if (!calendarPermission) {
      Alert.alert(
        'Нужно разрешение',
        'Пожалуйста, разрешите доступ к календарю в настройках телефона',
        [
          {
            text: 'Отмена',
            style: 'cancel',
          },
          {
            text: 'Открыть настройки',
            onPress: () => Linking.openSettings(),
          },
        ]
      );

      return false;
    }

    try {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      const eventDate = new Date(event.date);
      const [hours, minutes] = (event.time || '12:00').split(':').map(Number);

      eventDate.setHours(hours, minutes);

      const calendarEvent = {
        title: `${EVENT_LABELS[event.type]}: ${event.title}`,
        notes: event.description,
        startDate: eventDate,
        endDate: new Date(eventDate.getTime() + 60 * 60 * 1000),
        alarms: event.reminderMinutes
          ? [
              {
                relativeOffset: -event.reminderMinutes,
              },
            ]
          : [],
      };

      await Calendar.createEventAsync(defaultCalendar.id, calendarEvent);

      return true;
    } catch (error) {
      console.error('Экспорт в календарь ошибка:', error);
      return false;
    }
  };

  const addEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) {
      Alert.alert('Ошибка', 'Введите название события');
      return;
    }

    if (!newEventPetId) {
      Alert.alert('Ошибка', 'Выберите питомца');
      return;
    }

    const selectedPetObj = pets.find((p) => p.id === newEventPetId);

    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${BASE_URL}/api/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId: newEventPetId,
          title: newEventTitle,
          description: newEventDescription,
          date: selectedDate.toISOString().split('T')[0],
          time: newEventTime,
          type: newEventType,
          reminderMinutes: newEventReminder ? 60 : null,
        }),
      });

      if (response.ok) {
        const newEvent = await response.json();

        if (exportToPhone && calendarPermission) {
          const exported = await exportToSystemCalendar({
            ...newEvent,
            petName: selectedPetObj?.name,
          });

          if (exported) {
            Alert.alert('Успех', 'Событие добавлено в календарь телефона');
          }
        }

        await loadEvents();
        setModalVisible(false);
        resetForm();

        Alert.alert('Успех', 'Событие добавлено');
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить событие');
    }
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventType('reminder');
    setNewEventPetId(selectedPet?.id || null);
    setNewEventTime('12:00');
    setNewEventReminder(true);
    setExportToPhone(false);
  };

  const deleteEvent = async (eventId: string) => {
    Alert.alert('Удалить событие', 'Вы уверены?', [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(
              `${BASE_URL}/api/calendar/events/${eventId}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              await loadEvents();
              Alert.alert('Успех', 'Событие удалено');
            }
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось удалить событие');
          }
        },
      },
    ]);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToToday}
            style={styles.todayButton}
            activeOpacity={0.85}
          >
            <Text style={styles.todayButtonText}>Сегодня</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Календарь</Text>
        <Text style={styles.subtitle}>
          Планируйте прививки, визиты к врачу и напоминания для питомцев
        </Text>

        {pets.length === 0 ? (
          <ImageBackground
            source={cardBg}
            style={styles.noPetsCard}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            <View style={styles.emptyIconCircle}>
              <Ionicons name="paw-outline" size={34} color={COLORS.white} />
            </View>

            <Text style={styles.noPetsText}>У вас ещё нет питомцев</Text>

            <Text style={styles.noPetsSubtext}>
              Добавьте питомца, чтобы увидеть календарь заботы
            </Text>

            <TouchableOpacity
              style={styles.addPetButton}
              onPress={() => onNavigate?.('addPet')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={21} color={COLORS.white} />
              <Text style={styles.addPetButtonText}>Добавить питомца</Text>
            </TouchableOpacity>
          </ImageBackground>
        ) : (
          <>
            <ImageBackground
              source={cardBg}
              style={styles.petSelectorCard}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petSelectorContent}
              >
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petButton,
                      selectedPet?.id === pet.id && styles.petButtonSelected,
                    ]}
                    onPress={() => setSelectedPet(pet)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.petButtonText,
                        selectedPet?.id === pet.id &&
                          styles.petButtonTextSelected,
                      ]}
                    >
                      {pet.name}
                    </Text>

                    <Text
                      style={[
                        styles.petButtonIcon,
                        selectedPet?.id === pet.id &&
                          styles.petButtonTextSelected,
                      ]}
                    >
                      {pet.species === 'dog' ? '🐶' : '🐱'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ImageBackground>

            <ImageBackground
              source={cardBg}
              style={styles.calendarContainer}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  style={styles.monthNavButton}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chevron-back"
                    size={22}
                    color={COLORS.text}
                  />
                </TouchableOpacity>

                <View style={styles.monthTitleBlock}>
                  <Text style={styles.monthTitle}>
                    {MONTHS_RU[currentDate.getMonth()]}
                  </Text>
                  <Text style={styles.monthYear}>
                    {currentDate.getFullYear()}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  style={styles.monthNavButton}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <Text key={day} style={styles.weekdayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isCurrentMonthDate = isCurrentMonth(date);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        !isCurrentMonthDate && styles.otherMonthDay,
                        isToday(date) && styles.todayCell,
                        isSelected(date) && styles.selectedCell,
                      ]}
                      onPress={() => setSelectedDate(date)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonthDate && styles.otherMonthDayText,
                          isToday(date) && styles.todayText,
                          isSelected(date) && styles.selectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>

                      {dayEvents.length > 0 && (
                        <View style={styles.eventIndicators}>
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <View
                              key={i}
                              style={[
                                styles.eventDot,
                                {
                                  backgroundColor: EVENT_COLORS[event.type],
                                },
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ImageBackground>

            {selectedDate && (
              <ImageBackground
                source={cardBg}
                style={styles.eventsSection}
                imageStyle={styles.cardImage}
                resizeMode="cover"
              >
                <View style={styles.eventsHeader}>
                  <View>
                    <Text style={styles.eventsTitle}>
                      {selectedDate.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>

                    <Text style={styles.eventsSubtitle}>
                      {selectedDateEvents.length === 0
                        ? 'Событий пока нет'
                        : `${selectedDateEvents.length} событие(й)`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addEventButton}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={19} color={COLORS.white} />
                    <Text style={styles.addEventButtonText}>Добавить</Text>
                  </TouchableOpacity>
                </View>

                {selectedDateEvents.length === 0 ? (
                  <View style={styles.noEventsBlock}>
                    <Ionicons
                      name="calendar-clear-outline"
                      size={32}
                      color={COLORS.accentDark}
                    />
                    <Text style={styles.noEventsText}>
                      На этот день ничего не запланировано
                    </Text>
                  </View>
                ) : (
                  selectedDateEvents.map((event) => {
                    const petForEvent = pets.find((p) => p.id === event.petId);

                    return (
                      <View key={event.id} style={styles.eventCard}>
                        <View
                          style={[
                            styles.eventColorLine,
                            {
                              backgroundColor: EVENT_COLORS[event.type],
                            },
                          ]}
                        />

                        <View style={styles.eventCardContent}>
                          <View style={styles.eventIconCircle}>
                            <Ionicons
                              name={EVENT_ICONS[event.type]}
                              size={20}
                              color={COLORS.white}
                            />
                          </View>

                          <View style={styles.eventTextBlock}>
                            <Text style={styles.eventTitle}>
                              {event.title}
                            </Text>

                            {petForEvent && (
                              <Text style={styles.eventPetName}>
                                {petForEvent.name}{' '}
                                {petForEvent.species === 'dog' ? '🐶' : '🐱'}
                              </Text>
                            )}

                            {event.time && (
                              <Text style={styles.eventTime}>
                                {event.time}
                              </Text>
                            )}

                            {event.description ? (
                              <Text style={styles.eventDescription}>
                                {event.description}
                              </Text>
                            ) : null}
                          </View>

                          <TouchableOpacity
                            onPress={() => deleteEvent(event.id)}
                            style={styles.deleteEventButton}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color={COLORS.coral}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ImageBackground>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ImageBackground
            source={cardBg}
            style={styles.modalContent}
            imageStyle={styles.modalImage}
            resizeMode="cover"
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Добавить событие</Text>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseButton}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Питомец</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petSelectorModal}
              >
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petSelectButton,
                      newEventPetId === pet.id &&
                        styles.petSelectButtonActive,
                    ]}
                    onPress={() => setNewEventPetId(pet.id)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.petSelectButtonText,
                        newEventPetId === pet.id &&
                          styles.petSelectButtonTextActive,
                      ]}
                    >
                      {pet.name} {pet.species === 'dog' ? '🐶' : '🐱'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Тип события</Text>

              <View style={styles.typeSelector}>
                {(
                  [
                    'vaccination',
                    'deworming',
                    'vet_visit',
                    'reminder',
                  ] as CalendarEvent['type'][]
                ).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      newEventType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewEventType(type)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={EVENT_ICONS[type]}
                      size={18}
                      color={
                        newEventType === type ? COLORS.white : COLORS.text
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        newEventType === type &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {EVENT_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Название</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Например: Прививка от бешенства"
                placeholderTextColor={COLORS.textSoft}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
              />

              <Text style={styles.modalLabel}>Время</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="12:00"
                placeholderTextColor={COLORS.textSoft}
                value={newEventTime}
                onChangeText={setNewEventTime}
              />

              <Text style={styles.modalLabel}>Описание</Text>

              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Подробности..."
                placeholderTextColor={COLORS.textSoft}
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalSwitchRow}>
                <Text style={styles.modalSwitchLabel}>Напомнить за час</Text>

                <Switch
                  value={newEventReminder}
                  onValueChange={setNewEventReminder}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.accent,
                  }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.modalSwitchRow}>
                <Text style={styles.modalSwitchLabel}>
                  Экспорт в календарь телефона
                </Text>

                <Switch
                  value={exportToPhone}
                  onValueChange={setExportToPhone}
                  disabled={!calendarPermission}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.accent,
                  }}
                  thumbColor={COLORS.white}
                />
              </View>

              {!calendarPermission && (
                <Text style={styles.permissionWarning}>
                  Разрешите доступ к календарю в настройках, чтобы
                  экспортировать события
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addEvent}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveButtonText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ImageBackground>
        </View>
      </Modal>

      <BottomNav
        currentScreen="medications"
        onNavigate={(screen) => onNavigate?.(screen)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 130,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  todayButton: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  todayButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '900',
  },

  title: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.2,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSoft,
    fontWeight: '600',
  },

  noPetsCard: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  cardImage: {
    borderRadius: 32,
  },

  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.white,
  },

  noPetsText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  noPetsSubtext: {
    fontSize: 15,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
    fontWeight: '600',
  },

  addPetButton: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  addPetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  petSelectorCard: {
    borderRadius: 32,
    paddingVertical: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  petSelectorContent: {
    paddingHorizontal: 12,
    gap: 8,
  },

  petButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  petButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  petButtonText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  petButtonIcon: {
    fontSize: 16,
  },

  petButtonTextSelected: {
    color: COLORS.white,
  },

  calendarContainer: {
    borderRadius: 32,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  monthNavButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthTitleBlock: {
    alignItems: 'center',
  },

  monthTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },

  monthYear: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '900',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    marginVertical: 2,
  },

  otherMonthDay: {
    opacity: 0.35,
  },

  todayCell: {
    backgroundColor: COLORS.cardSoft,
  },

  selectedCell: {
    backgroundColor: COLORS.accent,
  },

  dayText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '800',
  },

  otherMonthDayText: {
    color: COLORS.textSoft,
  },

  todayText: {
    color: COLORS.text,
    fontWeight: '900',
  },

  selectedText: {
    color: COLORS.white,
  },

  eventIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 6,
  },

  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },

  eventsSection: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  eventsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  eventsSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  addEventButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  addEventButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  noEventsBlock: {
    alignItems: 'center',
    paddingVertical: 22,
  },

  noEventsText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    fontWeight: '700',
  },

  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  eventColorLine: {
    height: 5,
    width: '100%',
  },

  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },

  eventIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  eventTextBlock: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  eventPetName: {
    fontSize: 13,
    color: COLORS.accentDark,
    fontWeight: '800',
    marginTop: 3,
  },

  eventTime: {
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '700',
    marginTop: 3,
  },

  eventDescription: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginTop: 4,
    lineHeight: 17,
    fontWeight: '600',
  },

  deleteEventButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 32, 32, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  modalContent: {
    width: '100%',
    maxHeight: '86%',
    borderRadius: 32,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalImage: {
    borderRadius: 32,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },

  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
  },

  petSelectorModal: {
    gap: 8,
  },

  petSelectButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  petSelectButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  petSelectButtonText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },

  petSelectButtonTextActive: {
    color: COLORS.white,
  },

  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  typeButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  typeButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '800',
  },

  typeButtonTextActive: {
    color: COLORS.white,
  },

  modalInput: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 27,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontWeight: '600',
  },

  modalTextArea: {
    height: 90,
    borderRadius: 22,
    paddingTop: 14,
  },

  modalSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  modalSwitchLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
    marginRight: 10,
  },

  permissionWarning: {
    fontSize: 12,
    color: COLORS.coralDark,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 17,
  },

  modalButtons: {
    flexDirection: 'row',
    marginTop: 22,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.textSoft,
    fontWeight: '900',
    fontSize: 15,
  },

  saveButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 15,
  },
});

export default PetMedicationsScreen;