import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://mypethealthapp.onrender.com/api';

type RelationType =
  | 'mother'
  | 'father'
  | 'grandmother'
  | 'grandfather'
  | 'daughter'
  | 'son'
  | 'sister'
  | 'brother';

type RelationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'not_submitted';

type Pet = {
  id: number | string;
  name: string;
  species?: string;
  breed?: string | null;
  birth_date?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  sex?: string | null;
  photo_url?: string | null;
  breed_name?: string | null;
  breed_name_ru?: string | null;
};

type PedigreeRelation = {
  id: number;
  relative_type: RelationType;
  status: RelationStatus;
  review_comment?: string | null;
  relative_pet?: Pet | null;
};

type PetPedigreeProps = {
  visible: boolean;
  pet: Pet | null;
  pets: Pet[];
  onClose: () => void;
};

const RELATION_LABELS: Record<RelationType, string> = {
  mother: 'Мама',
  father: 'Папа',
  grandmother: 'Бабушка',
  grandfather: 'Дедушка',
  daughter: 'Дочь',
  son: 'Сын',
  sister: 'Сестра',
  brother: 'Брат',
};

const RELATION_ICONS: Record<RelationType, string> = {
  mother: 'female',
  father: 'male',
  grandmother: 'female-outline',
  grandfather: 'male-outline',
  daughter: 'paw',
  son: 'paw',
  sister: 'paw',
  brother: 'paw',
};

const STATUS_LABELS: Record<RelationStatus, string> = {
  pending: 'На проверке',
  approved: 'Подтверждено',
  rejected: 'Отклонено',
  not_submitted: 'Не отправлено',
};

const getStatusColor = (status: RelationStatus) => {
  switch (status) {
    case 'approved':
      return '#4CAF50';

    case 'rejected':
      return '#E57373';

    case 'pending':
      return '#E0A43A';

    default:
      return '#999999';
  }
};

const getPetSpeciesLabel = (species?: string) => {
  if (species === 'dog') return 'Собака';
  if (species === 'cat') return 'Кошка';

  return species || '';
};

const getPetBreed = (pet?: Pet | null) => {
  if (!pet) return '';

  return (
    pet.breed_name_ru ||
    pet.breed_name ||
    pet.breed ||
    ''
  );
};

const getSexLabel = (sex?: string | null) => {
  if (sex === 'male') return 'самец';
  if (sex === 'female') return 'самка';

  return '';
};

const readResponse = async (response: Response) => {
  const text = await response.text();

  console.log(
    '🌐 RESPONSE STATUS:',
    response.status,
  );

  console.log(
    '🌐 RESPONSE CONTENT-TYPE:',
    response.headers.get('content-type'),
  );

  console.log(
    '🌐 RESPONSE BODY:',
    text.substring(0, 1000),
  );

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(
      '❌ Сервер вернул не JSON:',
      text.substring(0, 1000),
    );

    throw new Error(
      `Сервер вернул некорректный ответ (${response.status}).`,
    );
  }
};

export default function PetPedigree({
  visible,
  pet,
  pets,
  onClose,
}: PetPedigreeProps) {
  const [relations, setRelations] = useState<
    PedigreeRelation[]
  >([]);

  const [availablePets, setAvailablePets] = useState<Pet[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showPetSelector, setShowPetSelector] =
    useState(false);

  const [selectedRelationType, setSelectedRelationType] =
    useState<RelationType | null>(null);

  const [selectedRelative, setSelectedRelative] =
    useState<Pet | null>(null);

  /**
   * Получаем родословную текущего питомца.
   */
  const loadPedigree = async () => {
    if (!pet?.id) return;

    try {
      setLoading(true);

      const token =
        await AsyncStorage.getItem('userToken');

      if (!token) {
        throw new Error(
          'Токен авторизации не найден',
        );
      }

      const url = `${API_URL}/pets/${pet.id}/pedigree`;

      console.log('PEDIGREE URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      console.log(
        'PEDIGREE STATUS:',
        response.status,
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Не удалось загрузить родословную',
        );
      }

      if (Array.isArray(data)) {
        setRelations(data);
      } else {
        setRelations([]);
      }
    } catch (error: any) {
      console.error(
        'Ошибка загрузки родословной:',
        error,
      );

      setRelations([]);

      Alert.alert(
        'Ошибка',
        error?.message ||
          'Не удалось загрузить родословную',
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Получаем питомцев, которых можно добавить
   * в качестве родственников.
   */
  const loadAvailablePets = async () => {
    if (!pet?.id) return;

    const fallbackPets = (pets || []).filter(
      (item) =>
        String(item.id) !== String(pet.id),
    );

    // Сразу показываем питомцев из props.
    setAvailablePets(fallbackPets);

    try {
      const token =
        await AsyncStorage.getItem('userToken');

      if (!token) {
        console.warn(
          'Токен не найден. Используем pets из AddPetScreen.',
        );

        return;
      }

      const url =
        `${API_URL}/pets/${pet.id}/pedigree/available-pets`;

      console.log(
        'AVAILABLE PETS URL:',
        url,
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      console.log(
        'AVAILABLE PETS STATUS:',
        response.status,
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Не удалось загрузить список питомцев',
        );
      }

      if (Array.isArray(data)) {
        const filtered = data.filter(
          (item: Pet) =>
            String(item.id) !== String(pet.id),
        );

        setAvailablePets(filtered);
      }
    } catch (error: any) {
      console.warn(
        'Не удалось получить список питомцев через backend.',
        error?.message,
      );

      setAvailablePets(fallbackPets);
    }
  };

  useEffect(() => {
    if (!visible || !pet?.id) {
      return;
    }

    loadPedigree();
    loadAvailablePets();
  }, [visible, pet?.id, pets]);

  useEffect(() => {
    if (!visible) {
      setShowAddModal(false);
      setShowPetSelector(false);
      setSelectedRelationType(null);
      setSelectedRelative(null);
    }
  }, [visible]);

  const resetAddForm = () => {
    setSelectedRelationType(null);
    setSelectedRelative(null);
    setShowPetSelector(false);
  };

  const openAddModal = () => {
    resetAddForm();

    if (pet) {
      const fallbackPets = (pets || []).filter(
        (item) =>
          String(item.id) !== String(pet.id),
      );

      setAvailablePets(fallbackPets);

      loadAvailablePets();
    }

    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (saving) return;

    setShowAddModal(false);
    resetAddForm();
  };

  /**
   * Выбор родственника.
   *
   * Теперь мы НЕ открываем отдельный Modal.
   * После выбора просто возвращаемся
   * к форме добавления.
   */
  const selectRelative = (relative: Pet) => {
    console.log('🐾 SELECTED RELATIVE:', {
      id: relative.id,
      name: relative.name,
    });

    setSelectedRelative(relative);
    setShowPetSelector(false);
  };

  /**
   * Создание новой связи.
   */
  const saveRelation = async () => {
    if (!pet?.id) return;

    if (!selectedRelationType) {
      Alert.alert(
        'Выберите родство',
        'Сначала укажите, кем приходится питомец.',
      );

      return;
    }

    if (!selectedRelative) {
      Alert.alert(
        'Выберите питомца',
        'Сначала выберите питомца из списка.',
      );

      return;
    }

    if (
      String(selectedRelative.id) ===
      String(pet.id)
    ) {
      Alert.alert(
        'Ошибка',
        'Питомец не может быть родственником самому себе.',
      );

      return;
    }

    try {
      setSaving(true);

      const token =
        await AsyncStorage.getItem('userToken');

      if (!token) {
        throw new Error(
          'Токен авторизации не найден',
        );
      }

      const url =
        `${API_URL}/pets/${pet.id}/pedigree`;

      console.log('SAVE PEDIGREE URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relative_pet_id:
            Number(selectedRelative.id),

          relative_type:
            selectedRelationType,
        }),
      });

      console.log(
        'SAVE PEDIGREE STATUS:',
        response.status,
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Не удалось добавить родственника',
        );
      }

      setShowAddModal(false);
      resetAddForm();

      await loadPedigree();

      Alert.alert(
        'Отправлено',
        'Родственная связь отправлена на проверку администратору.',
      );
    } catch (error: any) {
      console.error(
        'Ошибка сохранения родства:',
        error,
      );

      Alert.alert(
        'Ошибка',
        error?.message ||
          'Не удалось добавить родственника',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Повторная отправка отклонённой связи.
   */
  const resubmitRelation = async (
    relation: PedigreeRelation,
  ) => {
    if (!pet?.id || !relation.relative_pet) {
      return;
    }

    try {
      setSaving(true);

      const token =
        await AsyncStorage.getItem('userToken');

      if (!token) {
        throw new Error(
          'Токен авторизации не найден',
        );
      }

      const url =
        `${API_URL}/pets/${pet.id}/pedigree/${relation.id}/resubmit`;

      console.log(
        'RESUBMIT PEDIGREE URL:',
        url,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Не удалось повторно отправить связь',
        );
      }

      await loadPedigree();

      Alert.alert(
        'Отправлено',
        'Связь снова отправлена на проверку.',
      );
    } catch (error: any) {
      console.error(
        'Ошибка повторной отправки родства:',
        error,
      );

      Alert.alert(
        'Ошибка',
        error?.message ||
          'Не удалось повторно отправить связь',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Удаление связи.
   */
  const deleteRelation = async (
    relation: PedigreeRelation,
  ) => {
    if (!pet?.id) return;

    Alert.alert(
      'Удалить связь?',
      `Удалить связь «${
        RELATION_LABELS[relation.relative_type]
      } — ${
        relation.relative_pet?.name ||
        'питомец'
      }»?`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',

          onPress: async () => {
            try {
              setSaving(true);

              const token =
                await AsyncStorage.getItem(
                  'userToken',
                );

              if (!token) {
                throw new Error(
                  'Токен авторизации не найден',
                );
              }

              const url =
                `${API_URL}/pets/${pet.id}/pedigree/${relation.id}`;

              console.log(
                'DELETE PEDIGREE URL:',
                url,
              );

              const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
              });

              const data =
                await readResponse(response);

              if (!response.ok) {
                throw new Error(
                  data?.message ||
                    'Не удалось удалить связь',
                );
              }

              await loadPedigree();
            } catch (error: any) {
              console.error(
                'Ошибка удаления родства:',
                error,
              );

              Alert.alert(
                'Ошибка',
                error?.message ||
                  'Не удалось удалить связь',
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const renderRelative = ({
    item,
  }: {
    item: PedigreeRelation;
  }) => {
    const relative = item.relative_pet;

    if (!relative) {
      return null;
    }

    const statusColor = getStatusColor(
      item.status,
    );

    return (
      <View style={styles.relativeCard}>
        <View style={styles.relativeTop}>
          {relative.photo_url ? (
            <Image
              source={{
                uri: relative.photo_url,
              }}
              style={styles.relativeAvatar}
            />
          ) : (
            <View
              style={
                styles.relativeAvatarPlaceholder
              }
            >
              <Ionicons
                name="paw"
                size={25}
                color="#7BC9A8"
              />
            </View>
          )}

          <View style={styles.relativeMain}>
            <Text style={styles.relationLabel}>
              {
                RELATION_LABELS[
                  item.relative_type
                ]
              }
            </Text>

            <Text style={styles.relativeName}>
              {relative.name}
            </Text>

            {!!getPetBreed(relative) && (
              <Text style={styles.relativeInfo}>
                {getPetBreed(relative)}
              </Text>
            )}

            <Text style={styles.relativeInfo}>
              {getPetSpeciesLabel(
                relative.species,
              )}

              {getSexLabel(relative.sex)
                ? ` • ${getSexLabel(
                    relative.sex,
                  )}`
                : ''}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                borderColor: statusColor,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    statusColor,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusColor,
                },
              ]}
            >
              {
                STATUS_LABELS[
                  item.status
                ]
              }
            </Text>
          </View>
        </View>

        {item.status === 'rejected' &&
          item.review_comment && (
            <View style={styles.reviewBox}>
              <Text style={styles.reviewTitle}>
                Комментарий администратора
              </Text>

              <Text style={styles.reviewText}>
                {item.review_comment}
              </Text>
            </View>
          )}

        {item.status === 'rejected' && (
          <View style={styles.actionRow}>
            <Pressable
              style={
                styles.resubmitButton
              }
              onPress={() =>
                resubmitRelation(item)
              }
              disabled={saving}
            >
              <Ionicons
                name="refresh"
                size={17}
                color="#2F4F4F"
              />

              <Text
                style={styles.resubmitText}
              >
                Отправить снова
              </Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() =>
                deleteRelation(item)
              }
              disabled={saving}
            >
              <Ionicons
                name="trash-outline"
                size={17}
                color="#D85C5C"
              />
            </Pressable>
          </View>
        )}

        {item.status === 'not_submitted' && (
          <Pressable
            style={
              styles.deleteButtonFull
            }
            onPress={() =>
              deleteRelation(item)
            }
            disabled={saving}
          >
            <Ionicons
              name="trash-outline"
              size={17}
              color="#D85C5C"
            />

            <Text style={styles.deleteText}>
              Удалить
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderAvailablePet = ({
    item,
  }: {
    item: Pet;
  }) => {
    const isSelected =
      String(
        selectedRelative?.id,
      ) === String(item.id);

    return (
      <Pressable
        style={[
          styles.petOption,
          isSelected &&
            styles.petOptionSelected,
        ]}
        onPress={() =>
          selectRelative(item)
        }
      >
        {item.photo_url ? (
          <Image
            source={{
              uri: item.photo_url,
            }}
            style={styles.petOptionAvatar}
          />
        ) : (
          <View
            style={
              styles.petOptionAvatarPlaceholder
            }
          >
            <Ionicons
              name="paw"
              size={21}
              color="#7BC9A8"
            />
          </View>
        )}

        <View style={styles.petOptionInfo}>
          <Text style={styles.petOptionName}>
            {item.name}
          </Text>

          <Text
            style={styles.petOptionDetails}
          >
            {getPetSpeciesLabel(
              item.species,
            )}

            {getPetBreed(item)
              ? ` • ${getPetBreed(item)}`
              : ''}
          </Text>
        </View>

        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={25}
            color="#7BC9A8"
          />
        )}
      </Pressable>
    );
  };

  if (!pet) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={25}
              color="#2F4F4F"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Родословная
          </Text>

          <View
            style={
              styles.headerPlaceholder
            }
          />
        </View>

        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
        >
          {/* MAIN PET */}
          <View
            style={styles.petHeaderCard}
          >
            {pet.photo_url ? (
              <Image
                source={{
                  uri: pet.photo_url,
                }}
                style={styles.mainPetImage}
              />
            ) : (
              <View
                style={
                  styles.mainPetImagePlaceholder
                }
              >
                <Ionicons
                  name="paw"
                  size={42}
                  color="#7BC9A8"
                />
              </View>
            )}

            <View
              style={styles.mainPetInfo}
            >
              <Text
                style={styles.mainPetName}
              >
                {pet.name}
              </Text>

              <Text
                style={styles.mainPetSpecies}
              >
                {getPetSpeciesLabel(
                  pet.species,
                )}
              </Text>

              {!!getPetBreed(pet) && (
                <Text
                  style={styles.mainPetBreed}
                >
                  {getPetBreed(pet)}
                </Text>
              )}
            </View>
          </View>

          {/* INFO */}
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#7BC9A8"
            />

            <Text style={styles.infoText}>
              Добавляй родственников только
              из питомцев, которые уже есть
              в твоём аккаунте. Каждая новая
              связь отправляется на проверку
              администратору.
            </Text>
          </View>

          {/* SECTION */}
          <View
            style={styles.sectionHeader}
          >
            <View>
              <Text
                style={styles.sectionTitle}
              >
                Родственники
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                {relations.length
                  ? `${relations.length} ${
                      relations.length === 1
                        ? 'связь'
                        : 'связей'
                    }`
                  : 'Пока нет добавленных связей'}
              </Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={openAddModal}
            >
              <Ionicons
                name="add"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={styles.addButtonText}
              >
                Добавить
              </Text>
            </Pressable>
          </View>

          {/* RELATIONS */}
          {loading ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="large"
                color="#7BC9A8"
              />

              <Text
                style={styles.loadingText}
              >
                Загружаем родословную...
              </Text>
            </View>
          ) : relations.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="git-network-outline"
                  size={34}
                  color="#7BC9A8"
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                Родословная пока не заполнена
              </Text>

              <Text
                style={styles.emptyText}
              >
                Добавь маму, папу, братьев,
                сестёр или других родственников
                из своих питомцев.
              </Text>

              <Pressable
                style={styles.emptyButton}
                onPress={openAddModal}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  Добавить родственника
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              {relations.map((relation) => (
                <View
                  key={String(relation.id)}
                >
                  {renderRelative({
                    item: relation,
                  })}
                </View>
              ))}
            </View>
          )}

          {/* FOOTER */}
          <View
            style={styles.footerCard}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#7BC9A8"
            />

            <Text
              style={styles.footerText}
            >
              После проверки подтверждённые
              родственные связи будут
              отображаться в родословной.
            </Text>
          </View>
        </ScrollView>

        {/* =====================================================
            ADD RELATIVE MODAL
            Здесь теперь только ОДИН Modal.
            Выбор питомца открывается внутри него.
           ===================================================== */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => {
            if (showPetSelector) {
              setShowPetSelector(false);
            } else {
              closeAddModal();
            }
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.addModal}>

              {/* =================================================
                  PET SELECTOR SCREEN
                 ================================================= */}
              {showPetSelector ? (
                <>
                  <View
                    style={styles.modalHeader}
                  >
                    <View style={styles.selectorHeaderLeft}>
                      <Pressable
                        style={styles.backButton}
                        onPress={() =>
                          setShowPetSelector(false)
                        }
                      >
                        <Ionicons
                          name="chevron-back"
                          size={23}
                          color="#2F4F4F"
                        />
                      </Pressable>

                      <View>
                        <Text
                          style={
                            styles.modalTitle
                          }
                        >
                          Выберите питомца
                        </Text>

                        <Text
                          style={
                            styles.modalSubtitle
                          }
                        >
                          Только питомцы из вашего аккаунта
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={closeAddModal}
                      disabled={saving}
                    >
                      <Ionicons
                        name="close"
                        size={25}
                        color="#2F4F4F"
                      />
                    </Pressable>
                  </View>

                  {availablePets.length === 0 ? (
                    <View
                      style={styles.noPets}
                    >
                      <Ionicons
                        name="paw-outline"
                        size={40}
                        color="#B5C7BE"
                      />

                      <Text
                        style={
                          styles.noPetsTitle
                        }
                      >
                        Других питомцев нет
                      </Text>

                      <Text
                        style={
                          styles.noPetsText
                        }
                      >
                        Добавьте ещё одного питомца
                        в аккаунт, чтобы указать
                        его как родственника.
                      </Text>

                      <Pressable
                        style={
                          styles.backToFormButton
                        }
                        onPress={() =>
                          setShowPetSelector(false)
                        }
                      >
                        <Text
                          style={
                            styles.backToFormButtonText
                          }
                        >
                          Вернуться
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <FlatList
                      data={availablePets}
                      keyExtractor={(item) =>
                        String(item.id)
                      }
                      renderItem={
                        renderAvailablePet
                      }
                      contentContainerStyle={
                        styles.petList
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    />
                  )}
                </>
              ) : (
                <>
                  {/* =================================================
                      ADD FORM
                     ================================================= */}
                  <View
                    style={styles.modalHeader}
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Добавить родственника
                    </Text>

                    <Pressable
                      onPress={closeAddModal}
                      disabled={saving}
                    >
                      <Ionicons
                        name="close"
                        size={25}
                        color="#2F4F4F"
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.modalContent
                    }
                  >
                    {/* RELATION TYPE */}
                    <Text
                      style={styles.fieldLabel}
                    >
                      Кто это?
                    </Text>

                    <View
                      style={styles.relationGrid}
                    >
                      {(
                        Object.keys(
                          RELATION_LABELS,
                        ) as RelationType[]
                      ).map((type) => {
                        const selected =
                          selectedRelationType ===
                          type;

                        return (
                          <Pressable
                            key={type}
                            style={[
                              styles.relationOption,
                              selected &&
                                styles.relationOptionSelected,
                            ]}
                            onPress={() =>
                              setSelectedRelationType(
                                type,
                              )
                            }
                          >
                            <Ionicons
                              name={
                                RELATION_ICONS[
                                  type
                                ] as any
                              }
                              size={20}
                              color={
                                selected
                                  ? '#FFFFFF'
                                  : '#7BC9A8'
                              }
                            />

                            <Text
                              style={[
                                styles.relationOptionText,
                                selected &&
                                  styles.relationOptionTextSelected,
                              ]}
                            >
                              {
                                RELATION_LABELS[
                                  type
                                ]
                              }
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* RELATIVE PET */}
                    <Text
                      style={styles.fieldLabel}
                    >
                      Питомец
                    </Text>

                    <Pressable
                      style={styles.selector}
                      onPress={() => {
                        console.log(
                          '🐾 OPEN PET SELECTOR',
                        );

                        setShowPetSelector(true);
                      }}
                    >
                      {selectedRelative ? (
                        <>
                          {selectedRelative.photo_url ? (
                            <Image
                              source={{
                                uri: selectedRelative.photo_url,
                              }}
                              style={
                                styles.selectorAvatar
                              }
                            />
                          ) : (
                            <View
                              style={
                                styles.selectorAvatarPlaceholder
                              }
                            >
                              <Ionicons
                                name="paw"
                                size={19}
                                color="#7BC9A8"
                              />
                            </View>
                          )}

                          <View
                            style={
                              styles.selectorInfo
                            }
                          >
                            <Text
                              style={
                                styles.selectorName
                              }
                            >
                              {
                                selectedRelative.name
                              }
                            </Text>

                            <Text
                              style={
                                styles.selectorDetails
                              }
                            >
                              {getPetSpeciesLabel(
                                selectedRelative.species,
                              )}

                              {getPetBreed(
                                selectedRelative,
                              )
                                ? ` • ${getPetBreed(
                                    selectedRelative,
                                  )}`
                                : ''}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View
                            style={
                              styles.selectorIcon
                            }
                          >
                            <Ionicons
                              name="paw-outline"
                              size={22}
                              color="#7BC9A8"
                            />
                          </View>

                          <Text
                            style={
                              styles.selectorPlaceholder
                            }
                          >
                            Выберите питомца
                          </Text>
                        </>
                      )}

                      <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#999"
                      />
                    </Pressable>

                    {/* SUMMARY */}
                    {selectedRelationType &&
                      selectedRelative && (
                        <View
                          style={
                            styles.summaryCard
                          }
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={21}
                            color="#7BC9A8"
                          />

                          <Text
                            style={
                              styles.summaryText
                            }
                          >
                            {
                              selectedRelative.name
                            }
                            {' — '}
                            {RELATION_LABELS[
                              selectedRelationType
                            ].toLowerCase()}
                          </Text>
                        </View>
                      )}

                    {/* SAVE */}
                    <Pressable
                      style={[
                        styles.saveButton,
                        (!selectedRelationType ||
                          !selectedRelative ||
                          saving) &&
                          styles.saveButtonDisabled,
                      ]}
                      onPress={saveRelation}
                      disabled={
                        !selectedRelationType ||
                        !selectedRelative ||
                        saving
                      }
                    >
                      {saving ? (
                        <ActivityIndicator
                          color="#FFFFFF"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="send-outline"
                            size={19}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              styles.saveButtonText
                            }
                          >
                            Отправить на проверку
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },

  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE9',
    backgroundColor: '#FFFFFF',
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },

  headerPlaceholder: {
    width: 40,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  petHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },

  mainPetImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },

  mainPetImagePlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#EAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainPetInfo: {
    flex: 1,
    marginLeft: 15,
  },

  mainPetName: {
    fontSize: 23,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  mainPetSpecies: {
    marginTop: 3,
    fontSize: 14,
    color: '#70827A',
  },

  mainPetBreed: {
    marginTop: 3,
    fontSize: 14,
    color: '#7BC9A8',
    fontWeight: '600',
  },

  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#EAF6F0',
    marginBottom: 24,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#526A60',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#82918A',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: '#7BC9A8',
  },

  addButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 45,
  },

  loadingText: {
    marginTop: 12,
    color: '#718079',
    fontSize: 14,
  },

  emptyCard: {
    alignItems: 'center',
    padding: 25,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6F0',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2F4F4F',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#788780',
    textAlign: 'center',
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: '#7BC9A8',
  },

  emptyButtonText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  relativeCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },

  relativeTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  relativeAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  relativeAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  relativeMain: {
    flex: 1,
    marginLeft: 12,
  },

  relationLabel: {
    fontSize: 12,
    color: '#7BC9A8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  relativeName: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  relativeInfo: {
    marginTop: 2,
    fontSize: 12,
    color: '#788780',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  reviewBox: {
    marginTop: 12,
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#FFF5F5',
  },

  reviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A64D4D',
  },

  reviewText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#805959',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: '#EAF6F0',
  },

  resubmitText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  deleteButton: {
    width: 43,
    height: 40,
    marginLeft: 8,
    borderRadius: 11,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: '#FFF1F1',
  },

  deleteText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#D85C5C',
  },

  footerCard: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },

  footerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 18,
    color: '#788780',
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  addModal: {
    maxHeight: '90%',
    minHeight: 300,
    backgroundColor: '#F6F9F7',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 17,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  selectorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
    marginRight: 10,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#82918A',
  },

  modalContent: {
    padding: 20,
    paddingBottom: 35,
  },

  fieldLabel: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },

  relationOption: {
    width: '48%',
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE6E1',
    backgroundColor: '#FFFFFF',
  },

  relationOptionSelected: {
    backgroundColor: '#7BC9A8',
    borderColor: '#7BC9A8',
  },

  relationOptionText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#526A60',
  },

  relationOptionTextSelected: {
    color: '#FFFFFF',
  },

  selector: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6E1',
  },

  selectorIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6F0',
  },

  selectorAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
  },

  selectorAvatarPlaceholder: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6F0',
  },

  selectorInfo: {
    flex: 1,
    marginLeft: 10,
  },

  selectorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  selectorDetails: {
    marginTop: 2,
    fontSize: 12,
    color: '#788780',
  },

  selectorPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#89968F',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EAF6F0',
  },

  summaryText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#526A60',
    fontWeight: '600',
  },

  saveButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: '#7BC9A8',
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  petList: {
    padding: 15,
    paddingBottom: 30,
  },

  petOption: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 9,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EBE7',
  },

  petOptionSelected: {
    borderColor: '#7BC9A8',
    backgroundColor: '#F0F9F4',
  },

  petOptionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  petOptionAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6F0',
  },

  petOptionInfo: {
    flex: 1,
    marginLeft: 11,
  },

  petOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F4F4F',
  },

  petOptionDetails: {
    marginTop: 3,
    fontSize: 12,
    color: '#788780',
  },

  noPets: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 45,
  },

  noPetsTitle: {
    marginTop: 13,
    fontSize: 17,
    fontWeight: '700',
    color: '#2F4F4F',
    textAlign: 'center',
  },

  noPetsText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: '#788780',
  },

  backToFormButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#EAF6F0',
  },

  backToFormButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F4F4F',
  },
});
