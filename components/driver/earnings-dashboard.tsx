import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getMockEarnings } from "@/lib/mock-data";
import type { EarningsSummary } from "@/lib/types";
import * as Haptics from "expo-haptics";

type Period = "today" | "week" | "month";

export default function EarningsDashboard() {
  const colors = useColors();
  const [period, setPeriod] = useState<Period>("today");
  const earnings = getMockEarnings(period);

  const maxEarning = Math.max(...earnings.dailyBreakdown.map((d) => d.earnings), 1);

  const handlePeriod = useCallback((p: Period) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPeriod(p);
  }, []);

  return (
    <ScreenContainer className="px-4 pt-2">
      <Text style={[styles.title, { color: colors.foreground }]}>Earnings</Text>

      {/* Period selector */}
      <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
        {(["today", "week", "month"] as Period[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => handlePeriod(p)}
            style={({ pressed }) => [
              styles.periodBtn,
              period === p && { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === p ? "#fff" : colors.muted },
              ]}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main earnings card */}
        <View style={[styles.earningsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.earningsLabel, { color: colors.muted }]}>Total Earnings</Text>
          <Text style={[styles.earningsAmount, { color: colors.foreground }]}>
            ${earnings.totalEarnings.toFixed(2)}
          </Text>
          <Text style={[styles.earningsCurrency, { color: colors.primary }]}>BSD</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{earnings.totalTrips}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Trips</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {earnings.totalHours.toFixed(1)}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Online</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                ${earnings.averageFare.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Fare</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                ${earnings.tips.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Tips</Text>
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Breakdown</Text>
          <View style={styles.chartContainer}>
            {earnings.dailyBreakdown.map((day, i) => {
              const barHeight = (day.earnings / maxEarning) * 120;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={[styles.barValue, { color: colors.muted }]}>
                    ${day.earnings}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  <Text style={[styles.barLabel, { color: colors.muted }]}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="bolt.fill" size={20} color={colors.warning} />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>
              {earnings.totalTrips > 0 ? Math.round(earnings.totalEarnings / earnings.totalHours) : 0}
            </Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>$/hour</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="star.fill" size={20} color={colors.warning} />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>4.9</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Rating</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark" size={20} color={colors.success} />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>98%</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Accept</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800",
    paddingVertical: 16,
  },
  periodRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  earningsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
  },
  earningsAmount: {
    fontSize: 44,
    fontWeight: "800",
    marginTop: 4,
  },
  earningsCurrency: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    alignSelf: "center",
  },
  chartCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 160,
  },
  barCol: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: 11,
    marginBottom: 4,
  },
  bar: {
    width: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  quickStats: {
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  quickValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  quickLabel: {
    fontSize: 12,
  },
});
