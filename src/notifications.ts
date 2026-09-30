import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'

// Agendamento local não existe no web; lá as funções abaixo não fazem nada.
const supported = Platform.OS !== 'web'

export const LUNCH_REMINDER_MINUTES = 30

// O Android não permite mudar a vibração de um canal existente, por isso um id novo.
const CHANNEL_ID = 'timesheet-alerts'
const LEGACY_CHANNEL_ID = 'timesheet'
const EXIT_ID = 'exit-reminder'
const LUNCH_ID = 'lunch-reminder'
const LUNCH_CATEGORY = 'lunch'
const SNOOZE_ACTION = 'snooze'
const ACTION_TASK = 'timesheet-notification-action'

async function handleResponse(response: Notifications.NotificationResponse) {
  if (response.actionIdentifier !== SNOOZE_ACTION) return
  await Notifications.dismissNotificationAsync(response.notification.request.identifier)
  await schedule(LUNCH_ID, new Date(Date.now() + LUNCH_REMINDER_MINUTES * 60_000), {
    title: 'Fim do almoço',
    body: `Lembrete adiado por ${LUNCH_REMINDER_MINUTES} minutos. Hora de voltar do almoço.`,
    categoryIdentifier: LUNCH_CATEGORY,
  })
}

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })

  // Android entrega o toque no botão "Adiar" a esta task quando o app está fechado ou em segundo plano.
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(ACTION_TASK, async ({ data }) => {
    if (data && 'actionIdentifier' in data) await handleResponse(data)
  })
}

export async function setupNotifications() {
  if (!supported) return
  await Notifications.deleteNotificationChannelAsync(LEGACY_CHANNEL_ID)
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembretes de ponto',
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 800, 400, 800],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
  await Notifications.setNotificationCategoryAsync(LUNCH_CATEGORY, [
    {
      identifier: SNOOZE_ACTION,
      buttonTitle: `Adiar ${LUNCH_REMINDER_MINUTES} min`,
      options: { opensAppToForeground: false },
    },
  ])
  await Notifications.registerTaskAsync(ACTION_TASK)
  const { granted } = await Notifications.getPermissionsAsync()
  if (!granted) await Notifications.requestPermissionsAsync()
}

/** Com o app aberto, a resposta chega por aqui e não pela task. */
export function listenToResponses() {
  if (!supported) return () => {}
  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse)
  return () => subscription.remove()
}

function dateFromMinutes(minutesOfDay: number) {
  const date = new Date()
  date.setHours(0, minutesOfDay, 0, 0)
  return date
}

async function schedule(
  identifier: string,
  date: Date,
  content: Notifications.NotificationContentInput,
) {
  if (!supported) return
  await Notifications.cancelScheduledNotificationAsync(identifier)
  if (date.getTime() <= Date.now()) return
  await Notifications.scheduleNotificationAsync({
    identifier,
    // `insistent` é lido pelo patch em patches/expo-notifications+*.patch: vibra até ser tocada.
    content: { ...content, data: { ...content.data, insistent: true } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
  })
}

export function scheduleExitReminder(exitMinutes: number, exitLabel: string) {
  return schedule(EXIT_ID, dateFromMinutes(exitMinutes), {
    title: 'Hora de sair',
    body: `Sua saída está prevista para agora, às ${exitLabel}. Bata o ponto!`,
  })
}

export function scheduleLunchReminder(outMinutes: number, outLabel: string) {
  return schedule(LUNCH_ID, dateFromMinutes(outMinutes + LUNCH_REMINDER_MINUTES), {
    title: 'Fim do almoço',
    body: `Você saiu para o almoço às ${outLabel}. Já se passaram ${LUNCH_REMINDER_MINUTES} minutos.`,
    categoryIdentifier: LUNCH_CATEGORY,
  })
}

export async function cancelLunchReminder() {
  if (!supported) return
  await Notifications.cancelScheduledNotificationAsync(LUNCH_ID)
}
