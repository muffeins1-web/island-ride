import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getMockEarnings } from "@/lib/mock-data";
import type { EarningsSummary } from "@/lib/types";
import * as Haptics from "expo-haptics";

type Period = "today" | "week" | "month";
const GOLD = "#D4A853";

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
    <ScreenContainer className="px-5 pt-2">
      <Text style={[styles.title, { color: colors.foreground }]}>Your Earnings</Text>

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
        <View style={[styles.earningsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.earningsLabel, { color: colors.muted }]}>Total Earnings</Text>
          <Text style={[styles.earningsAmount, { color: colors.foreground }]}>
            ${earnings.totalEarnings.toFixed(2)}
          </Text>
          <Text style={[styles.earningsCurrency, { color: colors.primary }]}>BSD</Text>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
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
              <Text style={[styles.statValue, { color: GOLD }]}>
                ${earnings.tips.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Tips</Text>
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Breakdown</Text>
          <View style={styles.chartContainer}>
            {earnings.dailyBreakdown.map((day, i) => {
              const barHeight = (day.earnings / maxEarning) * 120;
              const isHighest = day.earnings === maxEarning;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={[styles.barValue, { color: isHighest ? colors.primary : colors.muted }]}>
                    ${day.earnings}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: isHighest ? colors.primary : colors.primary + "50",
                        borderRadius: 6,
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
          <View style={[styles.quickCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.quickIcon, { backgroundColor: GOLD + "15" }]}>
              <IconSymbol name="bolt.fill" size={18} color={GOLD} />
            </View>
            <Text style={[styles.quickValue, { color: colors.foreground }]}>
              ${earnings.totalTrips > 0 ? Math.round(earnings.totalEarnings / earnings.totalHours) : 0}
            </Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Per Hour</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.warning + "15" }]}>
              <IconSymbol name="star.fill" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.quickValue, { color: colors.foreground }]}>4.9</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Rating</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.success + "15" }]}>
              <IconSymbol name="checkmark" size={18} color={colors.success} />
            </View>
            <Text style={[styles.quickValue, { color: colors.foreground }]}>98%</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Accept</Text>
          </View>
        </View>

        {/* Payout info */}
        <View style={[styles.payoutCard, { backgroundColor: colors.surface }]}>
          <View style={styles.payoutRow}>
            <View style={[styles.payoutIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="creditcard.fill" size={18} color={colors.primary} />
            </View>
            <View style={styles.payoutInfo}>
              <Text style={[styles.payoutTitle, { color: colors.foreground }]}>Next Payout</Text>
              <Text style={[styles.payoutDate, { color: colors.muted }]}>Friday, March 13</Text>
            </View>
            <Text style={[styles.payoutAmount, { color: colors.primary }]}>
              ${earnings.totalEarnings.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", paddingVertical: 16 },
  periodRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  periodText: { fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingBottom: 32 },
  earningsCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  earningsLabel: { fontSize: 14 },
  earningsAmount: { fontSize: 48, fontWeight: "800", marginTop: 4 },
  earningsCurrency: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 0.5,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 17, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 28, alignSelf: "center" },
  chartCard: { padding: 18, borderRadius: 18, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 160,
  },
  barCol: { alignItems: "center", flex: 1, justifyContent: "flex-end" },
  barValue: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  bar: { width: 28, minHeight: 4 },
  barLabel: { fontSize: 12, marginTop: 6 },
  quickStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickValue: { fontSize: 20, fontWeight: "800" },
  quickLabel: { fontSize: 12 },
  payoutCard: { borderRadius: 16, padding: 16 },
  payoutRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  payoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  payoutInfo: { flex: 1 },
  payoutTitle: { fontSize: 15, fontWeight: "600" },
  payoutDate: { fontSize: 13, marginTop: 2 },
  payoutAmount: { fontSize: 20, fontWeight: "800" },
});
