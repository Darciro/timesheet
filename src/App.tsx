import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import heroImg from './assets/hero.png'

// Jornada diária: 8h48 de trabalho + 1h de intervalo = 9h48 entre entrada e saída (44h semanais)
const WORKDAY_SPAN_MINUTES = 9 * 60 + 48
const BREAK_HOURS = 1
const BREAK_MINUTES_ALT = 30
const WORKDAY_SPAN_MINUTES_ALT = WORKDAY_SPAN_MINUTES - (BREAK_HOURS * 60 - BREAK_MINUTES_ALT)
const WEEKLY_HOURS = 44

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function formatClock(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return minutes === 0 ? `${pad(hours)}h` : `${pad(hours)}h${pad(minutes)}`
}

function App() {
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [message, setMessage] = useState('')

  const handleCalculate = () => {
    const hours = Number(hour)
    const minutes = minute === '' ? 0 : Number(minute)

    if (hour === '' || Number.isNaN(hours) || hours < 0 || hours > 23 || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
      setMessage('Informe um horário de entrada válido (HH e MM) para calcular sua saída.')
      return
    }

    const startTotalMinutes = hours * 60 + minutes
    const endTotalMinutes = startTotalMinutes + WORKDAY_SPAN_MINUTES
    const endTotalMinutesAlt = startTotalMinutes + WORKDAY_SPAN_MINUTES_ALT

    const entrada = formatClock(startTotalMinutes)
    const saida = formatClock(endTotalMinutes)
    const saidaAlt = formatClock(endTotalMinutesAlt)

    setMessage(
      `Das ${entrada} às ${saida}, com ${BREAK_HOURS} (uma) hora de intervalo (${WEEKLY_HOURS} horas semanais)\n` +
        `Das ${entrada} às ${saidaAlt}, com ${BREAK_MINUTES_ALT} minutos de intervalo`,
    )
  }

  return (
    <View style={styles.center}>
      <Image source={heroImg} style={styles.hero} resizeMode="contain" />
      <View>
        <Text style={styles.title}>Timesheet</Text>
        <Text style={styles.subtitle}>
          Adicione um horário de entrada para saber quando bater o ponto de saída
        </Text>
      </View>
      <View style={styles.timeRow}>
        <TextInput
          style={styles.timeInput}
          value={hour}
          onChangeText={setHour}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={minute}
          onChangeText={setMinute}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
      <Pressable style={styles.counter} onPress={handleCalculate}>
        <Text style={styles.counterText}>Calcular saída</Text>
      </Pressable>
      {message ? <Text style={styles.result}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  hero: {
    width: 170,
    height: 179,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555555',
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    borderWidth: 2,
    borderColor: '#cccccc',
    borderRadius: 8,
    width: 56,
    height: 48,
    fontSize: 20,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
  },
  counter: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#eeeeee',
  },
  counterText: {
    fontSize: 16,
    color: '#333333',
  },
  result: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
})

export default App

