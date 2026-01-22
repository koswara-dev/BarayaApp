import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useCamatStore from '../../stores/camatStore';
import useUserStore from '../../stores/userStore';
import { useDebounce } from 'use-debounce';

export default function CreateCamatScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item } = route.params || {};
    const isEdit = !!item;

    const { createKecamatan, updateKecamatan, loading } = useCamatStore();
    const { searchUsers, searchResults, loading: loadingUsers } = useUserStore();
    
    // Form State
    const [kecamatan, setKecamatan] = useState(item?.kecamatan || '');
    const [userId, setUserId] = useState(item?.userId ? String(item.userId) : '');
    const [alamatKantor, setAlamatKantor] = useState(item?.alamatKantor || '');
    
    // User Search State
    const [searchUserQuery, setSearchUserQuery] = useState(item?.userName || '');
    const [debouncedSearchUser] = useDebounce(searchUserQuery, 500);
    const [showUserResults, setShowUserResults] = useState(false);

    useEffect(() => {
        if (debouncedSearchUser && showUserResults) {
             searchUsers(debouncedSearchUser);
        }
    }, [debouncedSearchUser, showUserResults]);

    const handleSelectUser = (user: any) => {
        setUserId(user.id);
        setSearchUserQuery(user.fullName);
        setShowUserResults(false);
    };

    const handleSubmit = async () => {
        if (!kecamatan || !userId) {
            Alert.alert('Error', 'Mohon lengkapi semua data');
            return;
        }

        const payload = {
            kecamatan,
            userId: parseInt(userId),
            alamatKantor: alamatKantor
        };

        let success;
        if (isEdit) {
            success = await updateKecamatan(item.id, payload);
        } else {
            success = await createKecamatan(payload);
        }

        if (success) {
            Alert.alert('Sukses', `Data Kecamatan berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Camat' : 'Buat Camat Baru'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nama Kecamatan</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: Darma"
                        value={kecamatan}
                        onChangeText={setKecamatan}
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View style={[styles.formGroup, { zIndex: 10 }]}>
                    <Text style={styles.label}>Cari Pengguna (Camat)</Text>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Cari nama pengguna..."
                            value={searchUserQuery}
                            onChangeText={(text) => {
                                setSearchUserQuery(text);
                                setShowUserResults(true);
                                if (!text) setUserId('');
                            }}
                            placeholderTextColor="#94A3B8"
                        />
                        {loadingUsers && (
                            <ActivityIndicator style={styles.loader} size="small" color="#F59E0B" />
                        )}
                    </View>
                    
                    {showUserResults && searchResults.length > 0 && (
                        <View style={styles.dropdown}>
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => String(item.id)}
                                nestedScrollEnabled
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.dropdownItem}
                                        onPress={() => handleSelectUser(item)}
                                    >
                                        <Text style={styles.dropdownText}>{item.fullName}</Text>
                                        <Text style={styles.dropdownSubText}>{item.email}</Text>
                                    </TouchableOpacity>
                                )}
                                style={{ maxHeight: 200 }}
                            />
                        </View>
                    )}
                    {userId ? (
                         <Text style={styles.selectedHelper}>ID User Terpilih: {userId}</Text>
                    ) : null}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Alamat Kantor</Text>
                    <TextInput
                        style={[styles.input, { height: 100 }]}
                        placeholder="Masukkan Alamat Kantor"
                        value={alamatKantor}
                        onChangeText={setAlamatKantor}
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitText}>Simpan Data</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
        position: 'relative',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    searchContainer: {
        position: 'relative',
    },
    loader: {
        position: 'absolute',
        right: 12,
        top: 14,
    },
    dropdown: {
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 1000,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    dropdownSubText: {
        fontSize: 12,
        color: '#64748B',
    },
    selectedHelper: {
        fontSize: 12,
        color: '#10B981',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#F59E0B',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#CBD5E1',
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
