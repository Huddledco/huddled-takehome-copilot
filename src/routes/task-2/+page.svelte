<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let { data }: { data: PageData } = $props();
  let chartCanvas: HTMLCanvasElement;
  let dayChartCanvas: HTMLCanvasElement;
  let chart: Chart;
  let dayChart: Chart;

  // Event weights as specified in requirements
  const eventWeights = {
    'like_track': 2,
    'add_track_to_playlist': 2,
    'play_track': 1,
    'share_track': 3
  };

  // Function to convert UTC timestamp to local timezone hour and day of week
  function getLocalTimeInfo(utcTimestamp: number, timezone: string): { hour: number, dayOfWeek: number } {
    const date = new Date(utcTimestamp);
    const localDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return {
      hour: localDate.getHours(),
      dayOfWeek: localDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    };
  }

  // Process raw data into engagement by artist and hour
  function processEngagementData(rawData: any[]) {
    const artistData = new Map();

    rawData.forEach(event => {
      const { artist_id, artist_name, event_type, created_at, timezone } = event;
      
      // Get local time info for this event
      const { hour: localHour, dayOfWeek } = getLocalTimeInfo(created_at, timezone);
      
      // Get engagement weight
      const weight = eventWeights[event_type as keyof typeof eventWeights] || 0;
      
      // Initialize artist data if not exists
      if (!artistData.has(artist_id)) {
        artistData.set(artist_id, {
          name: artist_name,
          hourlyEngagement: new Array(24).fill(0),
          dailyEngagement: new Array(7).fill(0),
          totalEngagement: 0
        });
      }
      
      const artistInfo = artistData.get(artist_id);
      // Add weighted engagement to the hour and day
      artistInfo.hourlyEngagement[localHour] += weight;
      artistInfo.dailyEngagement[dayOfWeek] += weight;
      artistInfo.totalEngagement += weight;
    });

    // Sort by total engagement and return top artists
    return Array.from(artistData.values())
      .sort((a, b) => b.totalEngagement - a.totalEngagement);
  }

  // Create the hourly chart
  function createHourlyChart(processedData: any[]) {
    const ctx = chartCanvas.getContext('2d');
    
    // Generate colors for each artist
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 99, 255, 0.8)',
      'rgba(99, 255, 132, 0.8)'
    ];

    const datasets = processedData.slice(0, 10).map((artist, index) => ({
      label: artist.name,
      data: artist.hourlyEngagement,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.8', '1'),
      borderWidth: 2,
      tension: 0.4
    }));

    chart = new Chart(ctx!, {
      type: 'line',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Artist Engagement by Hour of Day (Local Time)'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Hour of Day'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Total Positive Engagement Score'
            },
            beginAtZero: true
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  // Create the daily chart
  function createDailyChart(processedData: any[]) {
    const ctx = dayChartCanvas.getContext('2d');
    
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 99, 255, 0.8)',
      'rgba(99, 255, 132, 0.8)'
    ];

    const datasets = processedData.slice(0, 10).map((artist, index) => ({
      label: artist.name,
      data: artist.dailyEngagement,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.8', '1'),
      borderWidth: 2,
      tension: 0.4
    }));

    dayChart = new Chart(ctx!, {
      type: 'line',
      data: {
        labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Artist Engagement by Day of Week (Weekdays vs Weekends)'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Day of Week'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Total Positive Engagement Score'
            },
            beginAtZero: true
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  onMount(() => {
    const processedData = processEngagementData(data.rawData);
    createHourlyChart(processedData);
    createDailyChart(processedData);

    return () => {
      if (chart) {
        chart.destroy();
      }
      if (dayChart) {
        dayChart.destroy();
      }
    };
  });
</script>

<div class="flex flex-col items-center justify-center p-6">
  <h1 class="text-3xl font-bold mb-6">Task 2: Engagement Trends Analysis</h1>
  
  <div class="w-full max-w-6xl space-y-8">
    <!-- Hourly Engagement Chart -->
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <canvas bind:this={chartCanvas} class="w-full h-96"></canvas>
    </div>
    
    <!-- Daily Engagement Chart (Bonus) -->
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <canvas bind:this={dayChartCanvas} class="w-full h-96"></canvas>
    </div>
    
    <div class="bg-gray-50 p-6 rounded-lg">
      <h2 class="text-xl font-semibold mb-4">Analysis Summary</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 class="font-medium mb-2">Positive Engagement Weights:</h3>
          <ul class="text-sm space-y-1">
            <li>• Share Track: 3 points</li>
            <li>• Like Track: 2 points</li>
            <li>• Add to Playlist: 2 points</li>
            <li>• Play Track: 1 point</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Features:</h3>
          <ul class="text-sm space-y-1">
            <li>• Timezone-adjusted to user's local time</li>
            <li>• Shows top 10 artists by total engagement</li>
            <li>• Hourly breakdown (0-23)</li>
            <li>• Interactive chart with hover details</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Bonus Analysis:</h3>
          <ul class="text-sm space-y-1">
            <li>• Day of week engagement patterns</li>
            <li>• Weekday vs weekend comparison</li>
            <li>• Multiple visualization types</li>
            <li>• Sorted by total engagement</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>