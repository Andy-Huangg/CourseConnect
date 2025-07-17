import { useState, useEffect } from "react";

interface UseUserPreferencesProps {
  preferenceType: "courseOrder" | "studyBuddyOrder";
}

export const useUserPreferences = ({
  preferenceType,
}: UseUserPreferencesProps) => {
  const [order, setOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updatePreference = async (newOrder: number[]) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/preferences`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferenceType,
            preferenceValue: JSON.stringify(newOrder),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user preferences");
      }

      setOrder(newOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/user/preferences/${preferenceType}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user preferences");
        }

        const data = await response.json();
        if (data.preferenceValue) {
          try {
            const parsedOrder = JSON.parse(data.preferenceValue);
            if (Array.isArray(parsedOrder)) {
              setOrder(parsedOrder);
            }
          } catch {
            setOrder([]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadPreference();
  }, [preferenceType]);

  return {
    order,
    setOrder: updatePreference,
    loading,
    error,
  };
};
