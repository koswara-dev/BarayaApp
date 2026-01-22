# Implementation Plan - Add 'Berita' Notification Topic

This plan details the steps taken to add 'berita' to the list of subscribed notification topics in `src/utils/notificationHelper.ts`.

## User Objective

Add 'berita' topic subscription to the application's notification helper.

## Changes Implemented

### 1. Notification Helper Updates

- **File**: `src/utils/notificationHelper.ts`
- **Method**: `createChannels`
  - Added a new notification channel for 'berita' with high importance and public visibility.
- **Method**: `subscribeToTopics`
  - Added `await subscribeToTopic(messaging, 'berita')` to subscribe the device to the 'berita' FCM topic.
  - Updated the console log to reflect the new subscription.
- **Method**: `displayNotification`
  - Added logic to map notifications with `data.category === 'BERITA'` to the 'berita' channel.
  - Added a specific icon for 'BERITA' notifications.
  - Included 'BERITA' in the condition to use `AndroidStyle.BIGTEXT`.

## Verification

1.  **Channel Creation**: On app startup (specifically when `createChannels` is called), the 'Berita Terkini' channel should be created on Android devices.
2.  **Subscription**: The app should subscribe to the 'berita' topic on FCM. This can be verified by checking the console logs for "Subscribed to topics: darurat, event, pengaduan, berita".
3.  **Display**: Incoming FCM messages with `category: 'BERITA'` should be displayed using the 'berita' channel, the specified news icon, and the BigText style.
