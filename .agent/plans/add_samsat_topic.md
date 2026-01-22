# Implementation Plan - Add 'Samsat' Notification Topic

This plan details the steps taken to add 'samsat' to the list of subscribed notification topics in `src/utils/notificationHelper.ts`.

## User Objective

Add 'samsat' topic subscription to the application's notification helper, enabling users to receive Samsat-related notifications.

## Changes Implemented

### 1. Notification Helper Updates

- **File**: `src/utils/notificationHelper.ts`
- **Method**: `createChannels`
  - Added a new notification channel for 'samsat' ("Info Samsat") with high importance.
- **Method**: `subscribeToTopics`
  - Added `await subscribeToTopic(messaging, 'samsat')` to subscribe the device to the 'samsat' FCM topic.
  - Updated the console log to reflect the new subscription.
- **Method**: `displayNotification`
  - Added logic to map notifications with `data.category === 'SAMSAT'` to the 'samsat' channel.
  - Added a specific icon (Car Icon) for 'SAMSAT' notifications.
  - Included 'SAMSAT' in the condition to use `AndroidStyle.BIGTEXT`.

## Verification

1.  **Channel Creation**: On app startup, the 'Info Samsat' channel should be created on Android devices.
2.  **Subscription**: The app should subscribe to the 'samsat' topic on FCM.
3.  **Display**: Incoming FCM messages with `category: 'SAMSAT'` should be displayed using the 'samsat' channel, the car icon, and the BigText style.
