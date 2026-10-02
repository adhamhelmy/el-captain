"use client";
import { Group, Button, Text, Container, Skeleton } from "@mantine/core";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <div style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
      <Container size="lg" py="sm">
        <Group justify="space-between">
          <Text
            fw={700}
            size="xl"
            component={Link}
            href="/"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            El Captain
          </Text>
          {session ? (
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          ) : (
            <Group>
              {status === "loading" ? (
                <>
                  <Skeleton height={36} width={90} radius="md" />
                  <Skeleton height={36} width={90} radius="md" />
                </>
              ) : (
                <>
                  <Button variant="subtle" component={Link} href="/auth/login">
                    Login
                  </Button>
                  <Button component={Link} href="/auth/register">
                    Sign up
                  </Button>
                </>
              )}
            </Group>
          )}
        </Group>
      </Container>
    </div>
  );
}
