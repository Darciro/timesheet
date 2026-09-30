import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg'

import {
  LUNCH_REMINDER_MINUTES,
  cancelLunchReminder,
  listenToResponses,
  scheduleExitReminder,
  scheduleLunchReminder,
  setupNotifications,
} from './notifications'

// Jornada diária: 8h48 de trabalho (44h semanais)
const WORK_MINUTES = 8 * 60 + 48
const BREAK_FULL = 60
const BREAK_SHORT = 30
const WEEKLY_HOURS = 44

const theme = {
  bg: '#161826',
  surface: '#1d1f30',
  surfaceAlt: '#23263a',
  border: '#2e3148',
  text: '#e9e9ed',
  muted: '#9a9cb0',
  accent: '#9184d9',
  accentDeep: '#4a3f86',
  accentSoft: '#1f1c36',
  warn: '#d99a84',
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function formatClock(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return minutes === 0 ? `${pad(hours)}h` : `${pad(hours)}h${pad(minutes)}`
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h${pad(minutes)}min`
}

function parseTime(hour: string, minute: string) {
  const hours = Number(hour)
  const minutes = minute === '' ? 0 : Number(minute)
  const valid =
    hour !== '' &&
    !Number.isNaN(hours) &&
    hours >= 0 &&
    hours <= 23 &&
    !Number.isNaN(minutes) &&
    minutes >= 0 &&
    minutes <= 59
  return valid ? hours * 60 + minutes : null
}

/** Marca isométrica — hero e app icon usam o mesmo desenho. */
function Mark({ size = 176 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 480 480">
      <Defs>
        <LinearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.accent} />
          <Stop offset="1" stopColor={theme.accentDeep} />
        </LinearGradient>
        <LinearGradient id="slab" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.accent} />
          <Stop offset="1" stopColor={theme.accentDeep} />
        </LinearGradient>
        <LinearGradient id="dial" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#262a40" />
          <Stop offset="1" stopColor="#1b1e2e" />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.5" cy="0.42" r="0.5">
          <Stop offset="0" stopColor={theme.accent} stopOpacity="0.2" />
          <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="480" height="480" rx="104" fill={theme.bg} />
      <Rect width="480" height="480" rx="104" fill="url(#glow)" />
      <Path
        d="M240 56A156 156 0 1 1 97.49 148.55"
        fill="none"
        stroke="url(#arc)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <Circle cx="240" cy="212" r="132" fill="url(#dial)" stroke="#3a3e58" strokeWidth={1.5} />
      <Path d="M240 95L240 81" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M253.07 87.68L253.69 81.72" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M265.99 89.73L267.24 83.86" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M278.63 93.12L280.48 87.41" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M290.84 97.81L293.28 92.33" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M298.5 110.68L305.5 98.55" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M313.47 110.87L317 106.02" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M323.64 119.11L327.66 114.65" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M332.89 128.36L337.35 124.34" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M341.13 138.53L345.98 135" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M341.32 153.5L353.45 146.5" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M354.19 161.16L359.67 158.72" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M358.88 173.37L364.59 171.52" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M362.27 186.01L368.14 184.76" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M364.32 198.93L370.28 198.31" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M357 212L371 212" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M364.32 225.07L370.28 225.69" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M362.27 237.99L368.14 239.24" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M358.88 250.63L364.59 252.48" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M354.19 262.84L359.67 265.28" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M341.32 270.5L353.45 277.5" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M341.13 285.47L345.98 289" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M332.89 295.64L337.35 299.66" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M323.64 304.89L327.66 309.35" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M313.47 313.13L317 317.98" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M298.5 313.32L305.5 325.45" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M290.84 326.19L293.28 331.67" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M278.63 330.88L280.48 336.59" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M265.99 334.27L267.24 340.14" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M253.07 336.32L253.69 342.28" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M240 329L240 343" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M226.93 336.32L226.31 342.28" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M214.01 334.27L212.76 340.14" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M201.37 330.88L199.52 336.59" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M189.16 326.19L186.72 331.67" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M181.5 313.32L174.5 325.45" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M166.53 313.13L163 317.98" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M156.36 304.89L152.34 309.35" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M147.11 295.64L142.65 299.66" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M138.87 285.47L134.02 289" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M138.68 270.5L126.55 277.5" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M125.81 262.84L120.33 265.28" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M121.12 250.63L115.41 252.48" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M117.73 237.99L111.86 239.24" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M115.68 225.07L109.72 225.69" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M123 212L109 212" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M115.68 198.93L109.72 198.31" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M117.73 186.01L111.86 184.76" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M121.12 173.37L115.41 171.52" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M125.81 161.16L120.33 158.72" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M138.68 153.5L126.55 146.5" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M138.87 138.53L134.02 135" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M147.11 128.36L142.65 124.34" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M156.36 119.11L152.34 114.65" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M166.53 110.87L163 106.02" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M181.5 110.68L174.5 98.55" stroke={theme.accent} strokeWidth={2.4} />
      <Path d="M189.16 97.81L186.72 92.33" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M201.37 93.12L199.52 87.41" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M214.01 89.73L212.76 83.86" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path d="M226.93 87.68L226.31 81.72" stroke="#5a5f7d" strokeWidth={1.2} />
      <Path
        d="M240 212L137.29 178.63"
        stroke={theme.accent}
        strokeWidth={5.5}
        strokeLinecap="round"
      />
      <Path
        d="M240 212L166.92 179.46"
        stroke="#b9bbcb"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <Circle cx="240" cy="212" r="9" fill={theme.bg} stroke={theme.accent} strokeWidth={3} />
      <Path
        d="M150 300v66M330 300v66"
        stroke="#3a3e58"
        strokeWidth={1.2}
        strokeDasharray="4 7"
      />
      <Path
        d="M240 368 336 406 240 444 144 406Z"
        fill={theme.surfaceAlt}
        stroke={theme.accent}
        strokeWidth={1.5}
      />
      <Path d="M144 406v10l96 38 96-38v-10l-96 38Z" fill="url(#slab)" />
    </Svg>
  )
}

export function AppIcon({ size = 64 }: { size?: number }) {
  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Mark size={size * 0.72} />
    </View>
  )
}

function TimeField({
  label,
  hour,
  minute,
  onHour,
  onMinute,
  onPicked,
}: {
  label: string
  hour: string
  minute: string
  onHour: (value: string) => void
  onMinute: (value: string) => void
  onPicked?: (hour: string, minute: string) => void
}) {
  if (Platform.OS === 'android') {
    const openPicker = () => {
      const value = new Date()
      const current = parseTime(hour, minute)
      if (current !== null) value.setHours(Math.floor(current / 60), current % 60, 0, 0)
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return
          const pickedHour = pad(date.getHours())
          const pickedMinute = pad(date.getMinutes())
          onHour(pickedHour)
          onMinute(pickedMinute)
          onPicked?.(pickedHour, pickedMinute)
        },
      })
    }

    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={({ pressed }) => [styles.timeButton, pressed && styles.timeButtonPressed]}
          onPress={openPicker}
        >
          <Text style={[styles.timeButtonText, hour === '' && styles.timeButtonPlaceholder]}>
            {hour === '' ? 'HH:MM' : `${hour}:${minute === '' ? '00' : minute}`}
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.timeRow}>
        <TextInput
          style={styles.timeInput}
          value={hour}
          onChangeText={onHour}
          placeholder="HH"
          placeholderTextColor={theme.muted}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={minute}
          onChangeText={onMinute}
          placeholder="MM"
          placeholderTextColor={theme.muted}
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
    </View>
  )
}

function App() {
  const [hour, setHour] = useState(() => pad(new Date().getHours()))
  const [minute, setMinute] = useState(() => pad(new Date().getMinutes()))
  const [entryMinutes, setEntryMinutes] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [lunchOpen, setLunchOpen] = useState(false)
  const [outHour, setOutHour] = useState('')
  const [outMinute, setOutMinute] = useState('')
  const [backHour, setBackHour] = useState('')
  const [backMinute, setBackMinute] = useState('')
  const [lunch, setLunch] = useState<{ out: number; back: number | null } | null>(null)
  const [lunchError, setLunchError] = useState('')

  useEffect(() => {
    setupNotifications().catch(() => {})
    return listenToResponses()
  }, [])

  const calculate = (entryHour: string, entryMinute: string) => {
    const start = parseTime(entryHour, entryMinute)
    if (start === null) {
      setError('Informe um horário de entrada válido (HH e MM).')
      setEntryMinutes(null)
      return
    }
    setError('')
    setEntryMinutes(start)
  }

  // O retorno é opcional: só com a saída, o almoço fica em andamento e o lembrete é agendado.
  const hasBack = backHour !== ''

  const handleLunch = () => {
    const out = parseTime(outHour, outMinute)
    const back = hasBack ? parseTime(backHour, backMinute) : null
    if (out === null) {
      setLunchError('Informe a saída para o almoço (HH e MM).')
      return
    }
    if (hasBack && back === null) {
      setLunchError('Informe um retorno do almoço válido (HH e MM).')
      return
    }
    if (entryMinutes !== null && out < entryMinutes) {
      setLunchError('A saída para o almoço é anterior à sua entrada.')
      return
    }
    if (back !== null && back <= out) {
      setLunchError('O retorno precisa ser depois da saída para o almoço.')
      return
    }
    setLunchError('')
    // Com o retorno informado, o lembrete de fim de almoço não é mais necessário.
    if (back === null) scheduleLunchReminder(out, formatClock(out)).catch(() => {})
    else cancelLunchReminder().catch(() => {})
    setLunch({ out, back })
    setLunchOpen(false)
  }

  const result = useMemo(() => {
    if (entryMinutes === null) return null
    const entrada = formatClock(entryMinutes)
    return {
      entrada,
      full: formatClock(entryMinutes + WORK_MINUTES + BREAK_FULL),
      short: formatClock(entryMinutes + WORK_MINUTES + BREAK_SHORT),
    }
  }, [entryMinutes])

  const lunchResult = useMemo(() => {
    if (entryMinutes === null || !lunch || lunch.back === null) return null
    const taken = lunch.back - lunch.out
    const exit = entryMinutes + WORK_MINUTES + taken
    const reference = entryMinutes + WORK_MINUTES + BREAK_FULL
    const delta = exit - reference
    return {
      taken,
      exit: formatClock(exit),
      out: formatClock(lunch.out),
      back: formatClock(lunch.back),
      delta,
      belowMinimum: taken < BREAK_SHORT,
      exitMinutes: exit,
    }
  }, [entryMinutes, lunch])

  // Saída considerada no lembrete: a ajustada pelo almoço real ou, sem ela, a de 30 min de intervalo.
  const reminderExit =
    lunchResult?.exitMinutes ??
    (entryMinutes === null ? null : entryMinutes + WORK_MINUTES + BREAK_SHORT)

  useEffect(() => {
    if (reminderExit === null) return
    scheduleExitReminder(reminderExit, formatClock(reminderExit)).catch(() => {})
  }, [reminderExit])

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Mark size={168} />
        </View>

        <View style={styles.headings}>
          <Text style={styles.title}>Timesheet</Text>
          <Text style={styles.subtitle}>
            Adicione um horário de entrada para saber quando bater o ponto de saída
          </Text>
        </View>

        <TimeField
          label="Entrada"
          hour={hour}
          minute={minute}
          onHour={setHour}
          onMinute={setMinute}
          onPicked={calculate}
        />

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => calculate(hour, minute)}
        >
          <Text style={styles.buttonText}>Calcular saída</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {result ? (
          <View style={styles.card}>
            <Text style={styles.kicker}>Saída prevista</Text>
            <Text style={styles.line}>
              Das {result.entrada} às <Text style={styles.strong}>{result.full}</Text>, com 1
              (uma) hora de intervalo ({WEEKLY_HOURS} horas semanais)
            </Text>
            <View style={styles.rule} />
            <Text style={styles.line}>
              Das {result.entrada} às <Text style={styles.strong}>{result.short}</Text>, com{' '}
              {BREAK_SHORT} minutos de intervalo
            </Text>
          </View>
        ) : null}

        {result ? (
          <Pressable
            style={({ pressed }) => [styles.lunchCard, pressed && styles.lunchCardPressed]}
            onPress={() => setLunchOpen(true)}
          >
            <View style={styles.lunchCardHead}>
              <Text style={styles.kicker}>Almoço</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
            {lunch && lunch.back === null ? (
              <View>
                <Text style={styles.line}>
                  Em almoço desde {formatClock(lunch.out)} · lembrete às{' '}
                  {formatClock(lunch.out + LUNCH_REMINDER_MINUTES)}
                </Text>
                <Text style={styles.muted}>Toque para informar o retorno e recalcular a saída.</Text>
              </View>
            ) : lunchResult ? (
              <View>
                <Text style={styles.line}>
                  {lunchResult.out} → {lunchResult.back} ·{' '}
                  {formatDuration(lunchResult.taken)} de intervalo
                </Text>
                <Text style={styles.lunchExit}>Saída ajustada {lunchResult.exit}</Text>
                <Text style={styles.delta}>
                  {lunchResult.delta === 0
                    ? 'Igual à previsão de 1 hora de intervalo.'
                    : lunchResult.delta > 0
                      ? `${formatDuration(lunchResult.delta)} mais tarde que a previsão de 1 hora.`
                      : `${formatDuration(-lunchResult.delta)} mais cedo que a previsão de 1 hora.`}
                </Text>
                {lunchResult.belowMinimum ? (
                  <Text style={styles.warn}>
                    Intervalo abaixo de {BREAK_SHORT} minutos — confira a regra da sua jornada.
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.muted}>
                Informe a saída e o retorno reais para recalcular a batida de saída.
              </Text>
            )}
          </Pressable>
        ) : null}

        <Modal
          visible={lunchOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setLunchOpen(false)}
        >
          <KeyboardAvoidingView
            style={styles.backdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Horário de almoço</Text>
              <Text style={styles.muted}>
                {result ? `Entrada registrada às ${result.entrada}.` : ''} O intervalo real
                desloca a sua saída.
              </Text>

              <TimeField
                label="Saída para o almoço"
                hour={outHour}
                minute={outMinute}
                onHour={setOutHour}
                onMinute={setOutMinute}
              />
              <TimeField
                label="Retorno do almoço (opcional)"
                hour={backHour}
                minute={backMinute}
                onHour={setBackHour}
                onMinute={setBackMinute}
              />

              {lunchError ? <Text style={styles.error}>{lunchError}</Text> : null}

              <View style={styles.dialogActions}>
                <Pressable
                  style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed]}
                  onPress={() => setLunchOpen(false)}
                >
                  <Text style={styles.ghostText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={handleLunch}
                >
                  <Text style={styles.buttonText}>
                    {hasBack ? 'Recalcular saída' : 'Iniciar almoço'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    alignItems: 'stretch',
    gap: 17,
    paddingHorizontal: 22,
    paddingVertical: 34,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  headings: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '500',
    color: theme.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.muted,
    textAlign: 'center',
  },
  field: {
    gap: 7,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.muted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
    width: 64,
    height: 48,
    fontSize: 20,
    color: theme.text,
    textAlign: 'center',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
    minWidth: 136,
    height: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonPressed: {
    borderColor: theme.accent,
  },
  timeButtonText: {
    fontSize: 20,
    color: theme.text,
    letterSpacing: 1,
  },
  timeButtonPlaceholder: {
    color: theme.muted,
  },
  timeSeparator: {
    fontSize: 20,
    color: theme.accent,
  },
  button: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    backgroundColor: theme.accentSoft,
  },
  buttonText: {
    fontSize: 15,
    color: theme.accent,
    textAlign: 'center',
  },
  ghost: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ghostPressed: {
    backgroundColor: theme.surfaceAlt,
  },
  ghostText: {
    fontSize: 15,
    color: theme.muted,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
    padding: 17,
    gap: 11,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.accent,
  },
  line: {
    fontSize: 15,
    lineHeight: 23,
    color: theme.text,
  },
  strong: {
    color: theme.accent,
    fontWeight: '500',
  },
  rule: {
    height: 1,
    backgroundColor: theme.border,
  },
  lunchCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surfaceAlt,
    padding: 17,
    gap: 8,
  },
  lunchCardPressed: {
    borderColor: theme.accent,
  },
  lunchCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: {
    fontSize: 20,
    color: theme.accent,
  },
  lunchExit: {
    fontSize: 22,
    fontWeight: '500',
    color: theme.accent,
    marginTop: 6,
  },
  delta: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.muted,
    marginTop: 2,
  },
  warn: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.warn,
    marginTop: 6,
  },
  muted: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.muted,
  },
  error: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.warn,
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 11, 20, 0.72)',
    padding: 22,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
    padding: 20,
    gap: 15,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.text,
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
})

export default App
