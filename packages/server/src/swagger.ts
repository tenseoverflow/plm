import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PLM API",
      version: "0.2.0",
      description: "Personal Life Management API with passkey authentication",
      contact: {
        name: "tenseoverflow",
        email: "contact@hen.ee",
      },
      license: {
        name: "GPL-3.0",
        url: "https://www.gnu.org/licenses/gpl-3.0.html",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API endpoints",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
            },
          },
        },
        Task: {
          type: "object",
          required: ["id", "title", "done"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            done: { type: "boolean" },
          },
        },
        HabitSchedule: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["daily", "weekdays", "custom"],
            },
            daysOfWeek: {
              type: "array",
              items: {
                type: "integer",
                minimum: 0,
                maximum: 6,
              },
            },
            intervalWeeks: {
              type: "integer",
              minimum: 1,
            },
            onlyCurrentQuarter: {
              type: "boolean",
            },
            skippedWeeks: {
              type: "array",
              items: {
                type: "string",
                format: "date",
              },
            },
          },
        },
        Habit: {
          type: "object",
          required: ["id", "name", "schedule", "completions", "createdAt"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            schedule: { $ref: "#/components/schemas/HabitSchedule" },
            completions: {
              type: "array",
              items: {
                type: "string",
                format: "date",
              },
            },
            createdAt: {
              type: "string",
              format: "date",
            },
          },
        },
        FocusSession: {
          type: "object",
          required: ["id", "date", "seconds"],
          properties: {
            id: { type: "string" },
            date: { type: "string", format: "date" },
            seconds: { type: "integer" },
            label: { type: "string" },
            taskId: { type: "string" },
          },
        },
        QuarterItem: {
          type: "object",
          required: ["id", "title"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            notes: { type: "string" },
          },
        },
        FocusDefaults: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              enum: ["single", "pomodoro", "long"],
            },
            singleMinutes: { type: "integer" },
            pomodoroWork: { type: "integer" },
            pomodoroBreak: { type: "integer" },
            pomodoroRounds: { type: "integer" },
            longTotalMinutes: { type: "integer" },
            longBreakEvery: { type: "integer" },
            longBreakMinutes: { type: "integer" },
          },
        },
        UiPreferences: {
          type: "object",
          properties: {
            showMindfulnessInWeek: { type: "boolean" },
            soundEnabled: { type: "boolean" },
            notificationsEnabled: { type: "boolean" },
            autoStartNextSegment: { type: "boolean" },
            focusDefaults: { $ref: "#/components/schemas/FocusDefaults" },
          },
        },
        UserData: {
          type: "object",
          properties: {
            moodByDate: {
              type: "object",
              additionalProperties: {
                type: "integer",
                minimum: 1,
                maximum: 5,
              },
            },
            intentionByDate: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            tasksByDate: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { $ref: "#/components/schemas/Task" },
              },
            },
            journalByDate: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            backlogTasks: {
              type: "array",
              items: { $ref: "#/components/schemas/Task" },
            },
            habits: {
              type: "array",
              items: { $ref: "#/components/schemas/Habit" },
            },
            focusSessions: {
              type: "array",
              items: { $ref: "#/components/schemas/FocusSession" },
            },
            quarterPlans: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { $ref: "#/components/schemas/QuarterItem" },
              },
            },
            weeklyReportsByWeekStart: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            ui: { $ref: "#/components/schemas/UiPreferences" },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        InternalError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // Path to the API routes with JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);
