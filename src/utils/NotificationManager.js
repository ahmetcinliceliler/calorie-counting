import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi!');
        return;
    }
}


const NOTIFICATION_SCHEME_VERSION = 'v1';

export async function scheduleDailyReminders() {
    try {
        const scheduledVersion = await AsyncStorage.getItem('@notification_version');

        // Eğer bildirimler bu versiyon için zaten ayarlandıysa tekrar ayarlama
        if (scheduledVersion === NOTIFICATION_SCHEME_VERSION) {
            console.log("Bildirimler zaten güncel.");
            return;
        }

        await Notifications.cancelAllScheduledNotificationsAsync();

        // Kahvaltı Hatırlatıcısı (09:00)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Günaydın! ☀️",
                body: "Kahvaltını kaydetmeyi unutma. Güne zinde başla!",
            },
            trigger: { hour: 9, minute: 0, repeats: true },
        });

        // Öğle Yemeği (13:00)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Öğle Molası 🥗",
                body: "Öğle yemeğini sisteme girdin mi?",
            },
            trigger: { hour: 13, minute: 0, repeats: true },
        });

        // Akşam Yemeği (19:00)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Akşam Yemeği 🍽️",
                body: "Günün son öğününü kaydet ve hedeflerini kontrol et.",
            },
            trigger: { hour: 19, minute: 0, repeats: true },
        });

        // Su Hatırlatıcısı (Her 2 saatte bir, 10:00 - 22:00 arası)
        const waterHours = [10, 12, 14, 16, 18, 20, 22];
        for (const hour of waterHours) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Su İçme Vakti! 💧",
                    body: "Bir bardak su iç ve hedefine yaklaş.",
                },
                trigger: { hour: hour, minute: 0, repeats: true },
            });
        }

        await AsyncStorage.setItem('@notification_version', NOTIFICATION_SCHEME_VERSION);
        console.log("Bildirimler başarıyla planlandı.");
    } catch (error) {
        console.error("Bildirim planlama hatası:", error);
    }
}
