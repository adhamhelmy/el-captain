'use client'
import { MultiSelect, Select, TextInput, Group, Stack } from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { useState } from 'react'
import type { SearchParams } from '@el-captain/types'

const CLASS_TYPES = [
  'Kickboxing', 'Yoga', 'Pilates', 'Crossfit', 'Spinning', 'Zumba',
  'Boxing', 'Muay Thai', 'BJJ', 'MMA', 'Swimming', 'Dance',
  'Stretching', 'Strength', 'HIIT', 'Barre', 'Aerial', 'Capoeira',
]

const CITIES = [
  'Cairo', 'Maadi', 'New Cairo', 'Heliopolis', 'Nasr City', 'Zamalek',
  'Dokki', 'Mohandessin', 'Garden City', 'Downtown Cairo', 'Tagammu',
  'Rehab', 'Katameya', 'Shorouk', 'Sheikh Zayed', '6th of October',
  'New Administrative Capital', 'Ain Shams', 'Shubra', 'Badr City',
  'Giza', 'Alexandria', 'Sharm El-Sheikh', 'Hurghada', 'Luxor',
  'Aswan', 'Mansoura', 'Tanta', 'Ismailia', 'Suez', 'Port Said',
]

interface Props {
  onSearch: (params: SearchParams) => void
}

export function ClassSearch({ onSearch }: Props) {
  const [q, setQ] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [city, setCity] = useState<string | null>(null)

  const trigger = useDebouncedCallback((params: SearchParams) => onSearch(params), 300)

  function build(overrides: Partial<SearchParams>) {
    return { q: q || undefined, types, date: date || undefined, city: city || undefined, ...overrides }
  }

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Search classes by name or keyword..."
        value={q}
        onChange={(e) => { setQ(e.currentTarget.value); trigger(build({ q: e.currentTarget.value || undefined })) }}
      />
      <Group grow>
        <MultiSelect
          placeholder="Class type"
          searchable
          clearable
          data={CLASS_TYPES}
          value={types}
          onChange={(v) => { setTypes(v); trigger(build({ types: v })) }}
        />
        <TextInput
          type="date"
          placeholder="Date"
          value={date}
          onChange={(e) => { setDate(e.currentTarget.value); trigger(build({ date: e.currentTarget.value || undefined })) }}
        />
        <Select
          placeholder="Area / City"
          searchable
          clearable
          data={CITIES}
          value={city}
          onChange={(v) => { setCity(v); trigger(build({ city: v || undefined })) }}
        />
      </Group>
    </Stack>
  )
}
