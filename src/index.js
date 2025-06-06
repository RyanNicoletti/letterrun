export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // if (url.pathname.startsWith("/api/")) {
    //   if (!isSameOrigin(request)) {
    //     return new Response(JSON.stringify({ error: "Unauthorized request" }), {
    //       status: 403,
    //       headers: {
    //         "Content-Type": "application/json",
    //         "Access-Control-Allow-Origin": null,
    //       },
    //     });
    //   }
    // }

    if (url.pathname === "/api/getScores") {
      const response = await getScores(env);
      return response;
    } else if (url.pathname === "/api/postScore") {
      const response = await postScore(request, env);
      return response;
    }

    return env.ASSETS.fetch(request);
  },
};

// function isSameOrigin(request) {
//   const origin = request.headers.get("Origin");
//   const referer = request.headers.get("Referer");
//   const allowed = ["https://letterrun.com", "letterrun.com"];
//   if (origin) {
//     try {
//       const originUrl = new URL(origin);
//       return allowed.includes(originUrl.hostname);
//     } catch (e) {
//       return false;
//     }
//   }
//   if (referer) {
//     try {
//       const refererUrl = new URL(referer);
//       return allowedDomains.includes(refererUrl.hostname);
//     } catch (e) {
//       return false;
//     }
//   }
//   return false;
// }

async function getScores(env) {
  try {
    const high_scores = await env.LEADERBOARD.get("high_scores", "json");
    return new Response(JSON.stringify({ high_scores: high_scores || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching scores:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function postScore(request, env) {
  let high_scores = await env.LEADERBOARD.get("high_scores", "json");
  try {
    const res = await request.json();
    const player = res.data;
    high_scores.forEach(async (score) => {
      if (score.initials === player.initials) {
        await env.LEADERBOARD.delete(score.initials);
      }
    });
    const scoreToAdd = { initials: player.initials, score: player.score };
    high_scores.push(scoreToAdd);
    high_scores.sort((a, b) => b.score - a.score);
    const rankedScores = high_scores.map((score, index) => ({
      ...score,
      rank: index + 1,
    }));
    await env.LEADERBOARD.put("high_scores", JSON.stringify(rankedScores));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error posting score:", error);
    return new Response(JSON.stringify({ error: "Failed to save score" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
