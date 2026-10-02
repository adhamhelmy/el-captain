'use client';
import { Container, Group, Text, Divider } from '@mantine/core';

export function Footer() {
  return (
    <>
      <Divider mt='xl' />
      <Container size='lg' py='md'>
        <Group justify='space-between'>
          <Text size='sm' c='dimmed'>
            © {new Date().getFullYear()} El Captain. All rights reserved.
          </Text>
        </Group>
      </Container>
    </>
  );
}
