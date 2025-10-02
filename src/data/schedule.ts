export type ScheduleEntry = {
  time: string;
  title: string;
  description?: string;
  emphasis?: boolean;
};

export type ScheduleDay = {
  id: "friday" | "saturday";
  label: string;
  date: string;
  summary: string;
  sessions: ScheduleEntry[];
};

export const SCHEDULE: ScheduleDay[] = [
  {
    id: "friday",
    label: "Friday",
    date: "October 17",
    summary: "Registration opens at 6 PM with service kicking off at 7 PM inside the Worship Center.",
    sessions: [
      {
        time: "6:00 PM",
        title: "Registration & Doors Open",
        description: "Arrive early to check in and connect in the Worship Center.",
        emphasis: true,
      },
      {
        time: "7:00 PM",
        title: "Night 1 Service Begins",
        description: "Lean into worship and the opening message of the Available Conference.",
      },
    ],
  },
  {
    id: "saturday",
    label: "Saturday",
    date: "October 18",
    summary: "Full-day sessions, breakouts, and commissioning to close out the weekend.",
    sessions: [
      {
        time: "8:30 AM",
        title: "Doors Open",
        description: "Grab coffee, find your crew, and get set for day two.",
      },
      {
        time: "9:00 AM",
        title: "Service Begins",
        description: "Morning worship and teaching to set the tone.",
        emphasis: true,
      },
      {
        time: "9:15 AM",
        title: "Session 1: The 5 Fold Ministry",
        description: "Pastor Bradley Bennett unpacks the call to be spiritually available.",
      },
      {
        time: "10:30 AM",
        title: "Breakout #1: Physically Available",
        description: "Dive into context & culture conversations around availability.",
      },
      {
        time: "11:30 AM",
        title: "Lunch",
        description: "Refuel and build community before afternoon sessions.",
      },
      {
        time: "1:00 PM",
        title: "Podcast Round Table",
        description: "God's Coffee Call hosts a live conversation with conference voices.",
      },
      {
        time: "2:15 PM",
        title: "Breakout #2: Are You Disqualified?",
        description: "Explore the power of your YES and the strength of powerful prayers.",
      },
      {
        time: "3:30 PM",
        title: "Session 2: The Reward of Availability",
        description: "Co-leaders Brandon Kinchen & Kalyn Blevins continue the call to action.",
      },
      {
        time: "5:30 PM",
        title: "Dinner",
        description: "Share a meal and connect with new friends.",
      },
      {
        time: "7:00 PM",
        title: "Commissioning Service",
        description: "Apostle Krista Latham, Christ Transformation Church, closes the conference.",
        emphasis: true,
      },
    ],
  },
];

export const EVENT_DETAILS = {
  name: "AVAILABLE Conference",
  host: "God's Coffee Call",
  dates: "October 17–18, 2025",
  locationName: "Camp Living Waters",
  address: "21230 Livingwater Rd, Loranger, LA",
  registerUrl: "https://godscoffeecall.com",
};
