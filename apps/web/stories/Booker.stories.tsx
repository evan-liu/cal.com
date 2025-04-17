import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import dayjs from "@calcom/dayjs";
import type { BookerProps } from "@calcom/features/bookings/Booker";
import { Booker } from "@calcom/features/bookings/Booker";
import { useBookerLayout } from "@calcom/features/bookings/Booker/components/hooks/useBookerLayout";
import { useCalendars } from "@calcom/features/bookings/Booker/components/hooks/useCalendars";
import { useSlots } from "@calcom/features/bookings/Booker/components/hooks/useSlots";
import { useScheduleForEvent } from "@calcom/features/bookings/Booker/utils/event";
import type { BookerEvent } from "@calcom/features/bookings/types";
import { BookerLayouts } from "@calcom/prisma/zod-utils";
import type { AppRouter } from "@calcom/trpc/server/routers/_app";

import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";

// For PoweredByCal logo
Object.assign(process.env, { NEXT_PUBLIC_WEBAPP_URL: "https://app.cal.com" });

const defaultArgs = { dark: true, orgBanner: true, latency: 0, formLength: 3 };
type Args = typeof defaultArgs;

export const DarkMode = { args: { dark: true } } satisfies StoryObj<Args>;
export const LightMode = { args: { dark: false } } satisfies StoryObj<Args>;
export const Latency3s = { args: { latency: 3 }, name: "3s Latency" } satisfies StoryObj<Args>;
export const LongForm = { args: { formLength: 20 } } satisfies StoryObj<Args>;

export default {
  title: "Booker",
  component: BookerStories,
  render: (args) => (
    <MockTrpcProvider mocks={mockTrpc()} latency={args.latency}>
      <BookerStories {...args} />
    </MockTrpcProvider>
  ),
  parameters: { layout: "full-screen" },
  args: defaultArgs,
} satisfies Meta<Args>;

function BookerStories(args: Args) {
  useTheme(args.dark);
  return (
    <main dir="ltr" className="bg-default flex min-h-screen items-center justify-center">
      <Booker {...useMockBookerProps(args)} />
    </main>
  );
}

function useTheme(dark: boolean) {
  useEffect(() => {
    const rootClassList = document.documentElement.classList;
    dark ? rootClassList.add("dark") : rootClassList.remove("dark");
  }, [dark]);
}

function useMockBookerProps(args: Args): ComponentProps<typeof Booker> {
  const bookerProps: BookerProps = {
    eventSlug: "meet",
    username: "tester",
    orgBannerUrl: args.orgBanner
      ? "https://i.cal.com/api/avatar/97223786-7d36-4687-8663-1dc78b87b45b.png"
      : "",
    entity: { considerUnpublished: false },
  };

  const event = {
    title: "Meeting",
    description: "<p>A quick screen share demo or longer conversation.</p>\n",
    length: 15,
    requiresConfirmation: true,
    profile: {
      bookerLayouts: {
        enabledLayouts: [BookerLayouts.MONTH_VIEW],
        defaultLayout: BookerLayouts.MONTH_VIEW,
      },
    },
    subsetOfUsers: [
      {
        name: "CalCom User",
        weekStart: "Monday",
        avatarUrl: "https://cal.com/api/avatar/c0e68239-b19e-4d30-b4f8-cf0b4b4cf457.png",
      },
    ],
    entity: {},
    metadata: {
      multipleDuration: [15, 30],
    },
    bookingFields: mockBookingFields(args.formLength),
  } as BookerEvent;

  const wrapperProps = {
    event: { isSuccess: true, data: event },

    slots: useSlots({ id: 1, length: 15 }),
    calendars: useCalendars({ hasSession: false }),
    schedule: useScheduleForEvent({ username: bookerProps.username, eventSlug: bookerProps.eventSlug }),
    bookerLayout: useBookerLayout(event),

    bookerForm: { bookingForm: useForm() },
    bookings: { loadingStates: {} },
    verifyEmail: { handleVerifyEmail: fn() },

    isPlatform: false,
    rescheduleUid: null,
    hasSession: false,
    onConnectNowInstantMeeting: fn(),
    onGoBackInstantMeeting: fn(),
    onOverlayClickNoCalendar: fn(),
    onClickOverlayContinue: fn(),
    onOverlaySwitchStateChange: fn(),
    extraOptions: {},
  } as BookerEvent;

  return { ...bookerProps, ...wrapperProps };
}

function mockBookingFields(num: number) {
  return new Array(num).fill(null).map((_, i) => ({ label: `Field ${i + 1}` }));
}

function mockTrpc() {
  return {
    "viewer.timezones.cityTimezones": [],
    "viewer.slots.getSchedule": (input: any) => {
      const start = dayjs(input.startTime);
      return {
        slots: new Array(31).fill(null).reduce((r, _, i) => {
          const day = start.add(i, "days");
          return {
            ...r,
            [day.format("YYYY-MM-DD")]: new Array(24)
              .fill(null)
              .map((_, i) => ({ time: day.add(i / 2, "hours").toISOString() })),
          };
        }, {}),
      };
    },
  };
}

function MockTrpcProvider(props: { children: ReactNode; mocks: Record<string, unknown>; latency: number }) {
  const [trpc] = useState(() => createTRPCReact<AppRouter>());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        () =>
          ({ op: { path, input } }) =>
            observable((observer) => {
              const mock = props.mocks[path];
              if (!mock) return observer.error({ message: `No mock data for path ${path}` });

              try {
                const data = typeof mock === "function" ? mock(input) : mock;
                const complete = () => {
                  observer.next({ result: { data } });
                  observer.complete();
                };
                if (props.latency > 0) {
                  setTimeout(complete, props.latency * 1_000);
                } else {
                  complete();
                }
              } catch (e: any) {
                observer.error({ message: e?.message });
              }
            }),
      ],
      transformer: undefined as any,
    })
  );
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </trpc.Provider>
  );
}
