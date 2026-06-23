'use client'
import { TextInput, Select, Group, Button, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { SearchParams } from '@el-captain/types'

interface Props {
  onSearch: (params: SearchParams) => void
}

export function ClassSearch({ onSearch }: Props) {
  const form = useForm<SearchParams>({
    initialValues: { type: '', date: '', city: '' },
  })

  return (
    <form onSubmit={form.onSubmit(onSearch)}>
      <Stack gap="sm">
        <Group grow>
          <Select
            placeholder="Class type"
            clearable
            data={['kickboxing', 'yoga', 'pilates', 'crossfit', 'spinning', 'zumba']}
            {...form.getInputProps('type')}
          />
          <TextInput
            type="date"
            placeholder="Date"
            {...form.getInputProps('date')}
          />
          <TextInput
            placeholder="City"
            {...form.getInputProps('city')}
          />
        </Group>
        <Group>
          <Button type="submit">Search</Button>
          <Button variant="subtle" onClick={() => { form.reset(); onSearch({}) }}>Clear</Button>
        </Group>
      </Stack>
    </form>
  )
}
