"use client";

import axios from "axios";
import { useState } from "react";
import { set, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  CustomFlowbiteTheme,
  Label,
  Select,
  Textarea,
} from "flowbite-react";
import { AiOutlineLoading } from "react-icons/ai";
import { zodResolver } from "@hookform/resolvers/zod";

const ListWebSiteFormSchema = z.object({
  sites: z.string()
    .transform((value) => {
      if (value.trim() === '') {
        return [];
      }
      return value.split("\n").map((site) => site.trim());
    })
    .refine((sites) => sites.length > 0, {
      message: "You must add at least one URL",
    })
    .refine((sites) => sites.length <= 5, {
      message: "You can add up to 5 URLs",
    }),
  device: z.enum(["mobile", "desktop"]),
});

type ListInputWebSiteFormData = z.input<typeof ListWebSiteFormSchema>;
type ListOutputWebSiteFormData = z.output<typeof ListWebSiteFormSchema>;

interface scoreResponse {
  score: number;
}

const customTheme: CustomFlowbiteTheme["button"] = {
  color: {
    primary: "bg-red-500 hover:bg-red-600",
  },
  disabled: "cursor-not-allowed opacity-50 bg-red-600",
  spinnerLeftPosition: {
    md: "relative",
  },
  inner: {
    base: "flex justify-center items-center w-full gap-2",
  },
};

export default function Home() {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListInputWebSiteFormData, any, ListOutputWebSiteFormData>({
    resolver: zodResolver(ListWebSiteFormSchema),
  });

  const [average, setAverage] = useState(0);

  async function handleListWebSite({ sites, device }: ListOutputWebSiteFormData) {

    try {

      const scores: scoreResponse[] = await Promise.all(
        sites.map(async (site) => {
          console.log("testing: " + site);
          const { data } = await axios.get("/api/get-results", {
            params: { site, device },
          });
          return data;
        })
      );

      const avg =
        scores.reduce((acc, score) => acc + score.score, 0) / scores.length;

      console.log("average: " + avg);

      setAverage(avg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        setError("sites", {
          message: error.errors[0].message, // Show the first validation error message
        });
      } else {
        // Handle other errors
        setError("sites", {
          message: "Something went wrong, verify your URLs or try again later",
        });
      }
    }
  }

  const device = watch("device");

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-24 max-w-3xl m-auto text-center">
      <h1 className="text-4xl font-bold">
        {isSubmitting ? "Testing, please wait" : "Atomic Average Score Tester"}
      </h1>
      <p className="text-red-500">
        Test up of 5 pages in parallel using the Google Lighthouse API and get
        the average result of tested pages
      </p>
      {average > 0 && (
        <div className="text-2xl font-bold">
          Average score: {`${average.toFixed(2)} of 100 for ${device}`}
        </div>
      )}
      <form
        className="flex w-full max-w-md flex-col gap-4"
        onSubmit={handleSubmit(handleListWebSite)}
      >
        <div className="max-w-md">
          <div className="mb-2 block">
            <Label
              className="text-white"
              htmlFor="sites"
              value="Add your URLs, one per line"
            />
          </div>
          <Textarea {...register("sites")} placeholder="https://..." rows={5} />
          {errors.sites && (
            <div className="text-red-500 text-sm mt-1">
              {errors.sites.message}
            </div>
          )}
        </div>

        <div className="max-w-md">
          <div className="mb-2 block">
            <Label
              className="text-white"
              htmlFor="device"
              value="Select the device"
            />
          </div>
          <Select {...register("device")}>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </Select>
        </div>

        <Button
          theme={customTheme}
          disabled={isSubmitting}
          color="primary"
          size="md"
          type="submit"
          isProcessing={isSubmitting}
          processingSpinner={
            <AiOutlineLoading className="h-6 w-6 animate-spin" />
          }
        >
          {!isSubmitting ? "Get Average Score" : "Waiting Google API"}
        </Button>
      </form>
    </main>
  );
}
