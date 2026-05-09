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
  Platform,
  Switch,
  Linking
} from 'react-native';
import { Pet } from '../src/types';
import { useAuth } from '../src/hooks/AuthContext';
import { AppScreen } from '../src/types/navigation';
import BottomNav from './BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';

const BASE_URL = 'http://192.168.0.29:3001';

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
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const EVENT_COLORS = {
  vaccination: '#4CAF50',
  deworming: '#FF9800',
  vet_visit: '#F44336',
  reminder: '#2196F3'
};

const EVENT_ICONS = {
  vaccination: '💉',
  deworming: '🪱',
  vet_visit: '🏥',
  reminder: '🔔'
};

const PetMedicationsScreen: React.FC<PetMedicationsScreenProps> = ({ pets, onBack, onNavigate }) => {
  const { user } = useAuth();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(pets[0] || null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('reminder');
  const [newEventPetId, setNewEventPetId] = useState<number | null>(selectedPet?.id || null);
  const [newEventTime, setNewEventTime] = useState('12:00');
  const [newEventReminder, setNewEventReminder] = useState(true);
  const [exportToPhone, setExportToPhone] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);

  // Проверка разрешений для календаря
  useEffect(() => {
    checkCalendarPermission();
  }, []);

  const checkCalendarPermission = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setCalendarPermission(status === 'granted');
  };

  useEffect(() => {
    if (selectedPet) {
      loadEvents();
    }
  }, [selectedPet]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/calendar/events?petId=${selectedPet?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const getEventsForPet = (petId: number): CalendarEvent[] => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.petId === petId && e.date >= today).slice(0, 3);
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

  // Экспорт в системный календарь
  const exportToSystemCalendar = async (event: CalendarEvent) => {
    if (!calendarPermission) {
      Alert.alert(
        'Нужно разрешение',
        'Пожалуйста, разрешите доступ к календарю в настройках телефона',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Открыть настройки', onPress: () => Linking.openSettings() }
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
        title: `${EVENT_ICONS[event.type]} ${event.title}`,
        notes: event.description,
        startDate: eventDate,
        endDate: new Date(eventDate.getTime() + 60 * 60 * 1000),
        alarms: event.reminderMinutes ? [{ relativeOffset: -event.reminderMinutes }] : [],
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

    const selectedPetObj = pets.find(p => p.id === newEventPetId);

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
        
        // Экспорт в системный календарь
        if (exportToPhone && calendarPermission) {
          const exported = await exportToSystemCalendar({
            ...newEvent,
            petName: selectedPetObj?.name
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
    Alert.alert(
      'Удалить событие',
      'Вы уверены?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${BASE_URL}/api/calendar/events/${eventId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                await loadEvents();
                Alert.alert('Успех', 'Событие удалено');
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить событие');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Календарь</Text>
        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Сегодня</Text>
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <View style={styles.noPets}>
          <Text style={styles.noPetsEmoji}>🐾</Text>
          <Text style={styles.noPetsText}>У вас ещё нет питомцев</Text>
          <Text style={styles.noPetsSubtext}>Добавьте питомца, чтобы увидеть календарь</Text>
          <TouchableOpacity 
            style={styles.addPetButton}
            onPress={() => onNavigate?.('addPet')}
          >
            <Text style={styles.addPetButtonText}>➕ Добавить питомца</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Выбор питомца */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSelector}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petButton,
                  selectedPet?.id === pet.id && styles.petButtonSelected,
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text style={[
                  styles.petButtonText,
                  selectedPet?.id === pet.id && styles.petButtonTextSelected
                ]}>
                  {pet.name} {pet.species === 'dog' ? '🐶' : '🐱'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Календарь */}
          <View style={styles.calendarContainer}>
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                <Text style={styles.monthNavButtonText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTHS_RU[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                <Text style={styles.monthNavButtonText}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map(day => (
                <Text key={day} style={styles.weekdayText}>{day}</Text>
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
                  >
                    <Text style={[
                      styles.dayText,
                      !isCurrentMonthDate && styles.otherMonthDayText,
                      isToday(date) && styles.todayText,
                    ]}>
                      {date.getDate()}
                    </Text>
                    {dayEvents.length > 0 && (
                      <View style={styles.eventIndicators}>
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <View
                            key={i}
                            style={[
                              styles.eventDot,
                              { backgroundColor: EVENT_COLORS[event.type] }
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* События выбранного дня */}
          {selectedDate && (
            <View style={styles.eventsSection}>
              <View style={styles.eventsHeader}>
                <Text style={styles.eventsTitle}>
                  {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </Text>
                <TouchableOpacity
                  style={styles.addEventButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.addEventButtonText}>+ Добавить</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.eventsList}>
                {getEventsForDate(selectedDate).length === 0 ? (
                  <Text style={styles.noEventsText}>Нет событий на этот день</Text>
                ) : (
                  getEventsForDate(selectedDate).map(event => {
                    const petForEvent = pets.find(p => p.id === event.petId);
                    return (
                      <View key={event.id} style={[styles.eventCard, { borderLeftColor: EVENT_COLORS[event.type] }]}>
                        <View style={styles.eventCardContent}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.eventHeaderRow}>
                              <Text style={styles.eventIcon}>{EVENT_ICONS[event.type]}</Text>
                              <Text style={styles.eventTitle}>{event.title}</Text>
                            </View>
                            {petForEvent && (
                              <Text style={styles.eventPetName}>
                                {petForEvent.name} {petForEvent.species === 'dog' ? '🐶' : '🐱'}
                              </Text>
                            )}
                            {event.time && (
                              <Text style={styles.eventTime}>⏰ {event.time}</Text>
                            )}
                            {event.description ? (
                              <Text style={styles.eventDescription}>{event.description}</Text>
                            ) : null}
                          </View>
                          <TouchableOpacity onPress={() => deleteEvent(event.id)}>
                            <Text style={styles.deleteEventText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {/* Модальное окно добавления события */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить событие</Text>
            
            <Text style={styles.modalLabel}>Выберите питомца</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSelectorModal}>
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petSelectButton,
                    newEventPetId === pet.id && styles.petSelectButtonActive,
                  ]}
                  onPress={() => setNewEventPetId(pet.id)}
                >
                  <Text style={[
                    styles.petSelectButtonText,
                    newEventPetId === pet.id && styles.petSelectButtonTextActive,
                  ]}>
                    {pet.name} {pet.species === 'dog' ? '🐶' : '🐱'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Тип события</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, newEventType === 'vaccination' && styles.typeButtonActive]}
                onPress={() => setNewEventType('vaccination')}
              >
                <Text style={styles.typeButtonText}>💉 Прививка</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, newEventType === 'deworming' && styles.typeButtonActive]}
                onPress={() => setNewEventType('deworming')}
              >
                <Text style={styles.typeButtonText}>🪱 Глистогонка</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, newEventType === 'vet_visit' && styles.typeButtonActive]}
                onPress={() => setNewEventType('vet_visit')}
              >
                <Text style={styles.typeButtonText}>🏥 Визит к врачу</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, newEventType === 'reminder' && styles.typeButtonActive]}
                onPress={() => setNewEventType('reminder')}
              >
                <Text style={styles.typeButtonText}>🔔 Напоминание</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Название</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Например: Прививка от бешенства"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
            />
            
            <Text style={styles.modalLabel}>Время (необязательно)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="12:00"
              value={newEventTime}
              onChangeText={setNewEventTime}
            />

            <Text style={styles.modalLabel}>Описание (необязательно)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Подробности..."
              value={newEventDescription}
              onChangeText={setNewEventDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalSwitchLabel}>Напомнить за час</Text>
              <Switch
                value={newEventReminder}
                onValueChange={setNewEventReminder}
                trackColor={{ false: '#E8F0EC', true: '#7BC9A8' }}
              />
            </View>

            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalSwitchLabel}>Экспорт в календарь телефона</Text>
              <Switch
                value={exportToPhone}
                onValueChange={setExportToPhone}
                disabled={!calendarPermission}
                trackColor={{ false: '#E8F0EC', true: '#7BC9A8' }}
              />
            </View>

            {!calendarPermission && (
              <Text style={styles.permissionWarning}>
                🔔 Разрешите доступ к календарю в настройках, чтобы экспортировать события
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addEvent}
              >
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  container: { flex: 1, backgroundColor: '#F6F9F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#7A8F88', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '700', color: '#2F4F4F', flex: 1, textAlign: 'center' },
  todayButton: { padding: 8 },
  todayButtonText: { fontSize: 14, color: '#7BC9A8', fontWeight: '500' },

  noPets: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  noPetsEmoji: { fontSize: 64, marginBottom: 16 },
  noPetsText: { fontSize: 20, fontWeight: '700', color: '#2F4F4F', textAlign: 'center', marginBottom: 8 },
  noPetsSubtext: { fontSize: 16, color: '#7A8F88', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  addPetButton: { backgroundColor: '#7BC9A8', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 18, alignItems: 'center' },
  addPetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  petSelector: { paddingHorizontal: 16, paddingVertical: 16 },
  petButton: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E8F0EC' },
  petButtonSelected: { backgroundColor: '#7BC9A8', borderColor: '#7BC9A8' },
  petButtonText: { fontSize: 15, color: '#2F4F4F', fontWeight: '500' },
  petButtonTextSelected: { color: '#FFFFFF' },

  calendarContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, margin: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  monthNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthNavButton: { padding: 8 },
  monthNavButtonText: { fontSize: 20, color: '#2F4F4F' },
  monthTitle: { fontSize: 18, fontWeight: '600', color: '#2F4F4F' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 12 },
  weekdayText: { flex: 1, textAlign: 'center', fontSize: 14, color: '#7A8F88', fontWeight: '500' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  otherMonthDay: { opacity: 0.4 },
  todayCell: { backgroundColor: '#7BC9A8', borderRadius: 25 },
  selectedCell: { backgroundColor: '#E8F0EC', borderRadius: 25 },
  dayText: { fontSize: 16, color: '#2F4F4F' },
  otherMonthDayText: { color: '#A0B8B0' },
  todayText: { color: '#FFFFFF', fontWeight: '600' },
  eventIndicators: { flexDirection: 'row', position: 'absolute', bottom: 4 },
  eventDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 1 },

  eventsSection: { flex: 1, backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  eventsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventsTitle: { fontSize: 16, fontWeight: '600', color: '#2F4F4F' },
  addEventButton: { backgroundColor: '#7BC9A8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addEventButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  eventsList: { maxHeight: 250 },
  noEventsText: { fontSize: 14, color: '#7A8F88', textAlign: 'center', paddingVertical: 20 },
  eventCard: { backgroundColor: '#F8FCFA', borderRadius: 12, marginBottom: 8, borderLeftWidth: 4 },
  eventCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  eventHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { fontSize: 16, marginRight: 6 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#2F4F4F' },
  eventPetName: { fontSize: 12, color: '#7BC9A8', marginTop: 4 },
  eventTime: { fontSize: 11, color: '#A0B8B0', marginTop: 2 },
  eventDescription: { fontSize: 12, color: '#7A8F88', marginTop: 4 },
  deleteEventText: { fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, width: '90%', maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2F4F4F', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#2F4F4F', marginBottom: 6, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#F9FBFA' },
  modalTextArea: { height: 80, textAlignVertical: 'top' },
  
  petSelectorModal: { flexDirection: 'row', marginBottom: 8 },
  petSelectButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8F0EC', marginRight: 8 },
  petSelectButtonActive: { backgroundColor: '#7BC9A8' },
  petSelectButtonText: { fontSize: 13, color: '#2F4F4F' },
  petSelectButtonTextActive: { color: '#FFFFFF' },

  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  typeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8F0EC' },
  typeButtonActive: { backgroundColor: '#7BC9A8' },
  typeButtonText: { fontSize: 12, color: '#2F4F4F' },
  
  modalSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  modalSwitchLabel: { fontSize: 14, color: '#2F4F4F' },
  permissionWarning: { fontSize: 12, color: '#FF9800', marginTop: 8, textAlign: 'center' },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E8F0EC' },
  cancelButtonText: { color: '#7A8F88', fontWeight: '500' },
  saveButton: { backgroundColor: '#7BC9A8' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
});

export default PetMedicationsScreen;