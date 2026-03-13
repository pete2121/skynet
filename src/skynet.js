(function () {
  function normalize(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function extractTableData(element) {
    const rows = element.querySelectorAll("tr").length
      ? element.querySelectorAll("tr")
      : element.querySelectorAll('[role="row"]');

    return Array.from(rows)
      .map(function (row) {
        const cells = row.querySelectorAll("td,th").length
          ? row.querySelectorAll("td,th")
          : row.querySelectorAll('[role="gridcell"]');

        return Array.from(cells).map(function (cell) {
          return normalize(cell.innerText);
        });
      })
      .filter(function (row) {
        return row.length;
      });
  }

  function sameData(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  const results = [];

  function addResult(status, test, details) {
    results.push({
      status: status,
      test: test,
      details: details || "",
      time: new Date().toLocaleTimeString(),
      url: location.href,
      route: location.hash || "",
    });
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: type });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 500);
  }

  function exportJSON() {
    downloadFile(
      "skynet-report.json",
      JSON.stringify(results, null, 2),
      "application/json"
    );
  }

  function csvCell(value) {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    return '"' + String(stringValue).replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    const lines = [
      ["status", "test", "details", "time", "url", "route"]
        .map(csvCell)
        .join(","),
    ].concat(
      results.map(function (result) {
        return [
          result.status,
          result.test,
          typeof result.details === "string"
            ? result.details
            : JSON.stringify(result.details),
          result.time,
          result.url,
          result.route,
        ]
          .map(csvCell)
          .join(",");
      })
    );

    downloadFile(
      "skynet-report.csv",
      lines.join("\n"),
      "text/csv;charset=utf-8"
    );
  }

  function waitFor(selector, timeout = 5000, interval = 100) {
    return new Promise(function (resolve, reject) {
      const start = Date.now();

      const timer = setInterval(function () {
        const element = document.querySelector(selector);

        if (element) {
          clearInterval(timer);
          console.log("✅ PASS - element found:", selector);
          addResult("PASS", "Wait for " + selector, {
            selector: selector,
            timeout: timeout,
            found: true,
          });
          resolve(element);
          return;
        }

        if (Date.now() - start >= timeout) {
          clearInterval(timer);
          console.error("❌ FAIL - wait timeout:", selector);
          addResult("FAIL", "Wait for " + selector, {
            selector: selector,
            timeout: timeout,
            found: false,
          });
          reject(new Error("Element not found: " + selector));
        }
      }, interval);
    });
  }

  function report() {
    const pass = results.filter(function (x) {
      return x.status === "PASS";
    }).length;

    const fail = results.filter(function (x) {
      return x.status === "FAIL";
    }).length;

    const total = results.length;
    const passPct = total ? Math.round((pass / total) * 100) : 0;
    const failPct = total ? Math.round((fail / total) * 100) : 0;

    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      console.error("❌ FAIL - popup blocked for report tab");
      return;
    }

    const rows = results
      .map(function (result, index) {
        return (
          "<tr>" +
          "<td>" +
          (index + 1) +
          "</td>" +
          '<td style="color:' +
          (result.status === "PASS" ? "#7CFFB2" : "#ff6b6b") +
          ';font-weight:bold">' +
          escapeHtml(result.status) +
          "</td>" +
          "<td>" +
          escapeHtml(result.test) +
          "</td>" +
          "<td><pre style=\"white-space:pre-wrap;margin:0;font-family:inherit\">" +
          escapeHtml(
            typeof result.details === "string"
              ? result.details
              : JSON.stringify(result.details, null, 2)
          ) +
          "</pre></td>" +
          "<td>" +
          escapeHtml(result.time) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    const jsonData = escapeHtml(JSON.stringify(results, null, 2));
    const csvData = escapeHtml(
      [["status", "test", "details", "time", "url"].join(",")]
        .concat(
          results.map(function (result) {
            return [
              result.status,
              result.test,
              typeof result.details === "string"
                ? result.details
                : JSON.stringify(result.details),
              result.time,
              result.url,
            ]
              .map(function (value) {
                return '"' + String(value).replace(/"/g, '""') + '"';
              })
              .join(",");
          })
        )
        .join("\n")
    );

    reportWindow.document.write(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>SKYNET SYSTEM REPORT</title>
  <style>
    body{margin:0;background:#070707;color:#ffd7d7;font-family:Consolas,Monaco,monospace}
    .wrap{padding:24px;max-width:1200px;margin:0 auto}
    h1{margin:0 0 8px;color:#ff3b3b;text-shadow:0 0 10px rgba(255,0,0,.7)}
    .sub{color:#ff9c9c;margin-bottom:18px}
    .top{display:flex;gap:18px;align-items:stretch;flex-wrap:wrap}
    .card{background:#120909;border:1px solid #5a1919;border-radius:14px;box-shadow:0 0 16px rgba(255,0,0,.18),inset 0 0 20px rgba(255,0,0,.06);padding:18px}
    .stats{min-width:260px;flex:1}
    .stats .num{font-size:34px;color:#fff}
    .stats .row{margin:10px 0;color:#ffb0b0}
    .chart{min-width:320px;flex:1.3}
    .barbox{margin-top:12px}
    .barlabel{display:flex;justify-content:space-between;font-size:13px;margin:8px 0 4px;color:#ffb0b0}
    .bar{height:18px;background:#220c0c;border-radius:999px;overflow:hidden;border:1px solid #4a1717}
    .fill-pass{height:100%;width:${passPct}%;background:linear-gradient(90deg,#3ddc97,#7CFFB2);box-shadow:0 0 10px rgba(124,255,178,.35)}
    .fill-fail{height:100%;width:${failPct}%;background:linear-gradient(90deg,#ff4d4d,#ff8a8a);box-shadow:0 0 10px rgba(255,106,106,.35)}
    .pieWrap{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
    .donut{width:170px;height:170px;border-radius:50%;background:conic-gradient(#7CFFB2 0 ${passPct}%, #ff6b6b ${passPct}% 100%);position:relative;box-shadow:0 0 20px rgba(255,0,0,.18)}
    .donut:after{content:"";position:absolute;inset:28px;background:#120909;border-radius:50%;border:1px solid #4a1717}
    .centerText{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;font-weight:bold;z-index:1}
    .centerText b{font-size:28px;color:#fff}
    .legend div{margin:8px 0}
    .legend .pass::before,.legend .fail::before{content:"";display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px}
    .legend .pass::before{background:#7CFFB2}
    .legend .fail::before{background:#ff6b6b}
    .btns{margin:18px 0 14px;display:flex;gap:10px;flex-wrap:wrap}
    button{background:#ff3b3b;color:#1a0000;border:none;border-radius:10px;padding:10px 14px;font-weight:bold;cursor:pointer;box-shadow:0 0 14px rgba(255,0,0,.25)}
    button.secondary{background:#1b1010;color:#ffd7d7;border:1px solid #5a1919}
    table{width:100%;border-collapse:collapse;background:#100909;border-radius:14px;overflow:hidden}
    th,td{border:1px solid #3d1414;padding:10px;vertical-align:top;text-align:left}
    th{background:#1f0c0c;color:#ff6969}
    tr:nth-child(even){background:#0d0808}
    pre{max-width:640px;overflow:auto}
    .muted{color:#b58484;margin-top:12px}
    textarea{width:100%;min-height:180px;background:#0c0606;color:#ffd7d7;border:1px solid #4a1717;border-radius:10px;padding:12px;font-family:Consolas,monospace}
    .panel{display:none}
    .panel.active{display:block}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>SKYNET SYSTEM REPORT</h1>
    <div class="sub">Automation diagnostic summary</div>

    <div class="top">
      <div class="card stats">
        <div class="num">${total}</div>
        <div>Total tests</div>
        <div class="row">PASS: <b style="color:#7CFFB2">${pass}</b></div>
        <div class="row">FAIL: <b style="color:#ff6b6b">${fail}</b></div>
        <div class="row">URL: ${escapeHtml(location.href)}</div>
      </div>

      <div class="card chart">
        <div class="pieWrap">
          <div class="donut">
            <div class="centerText"><b>${total}</b><span>Total</span></div>
          </div>
          <div class="legend">
            <div class="pass">PASS: ${pass} (${passPct}%)</div>
            <div class="fail">FAIL: ${fail} (${failPct}%)</div>
          </div>
        </div>

        <div class="barbox">
          <div class="barlabel"><span>PASS</span><span>${passPct}%</span></div>
          <div class="bar"><div class="fill-pass"></div></div>

          <div class="barlabel"><span>FAIL</span><span>${failPct}%</span></div>
          <div class="bar"><div class="fill-fail"></div></div>
        </div>
      </div>
    </div>

    <div class="btns">
      <button onclick="window.print()">Print / Save PDF</button>
      <button onclick="downloadJSON()">Export JSON</button>
      <button onclick="downloadCSV()">Export CSV</button>
      <button class="secondary" onclick="showTab('table')">Table</button>
      <button class="secondary" onclick="showTab('json')">JSON</button>
      <button class="secondary" onclick="showTab('csv')">CSV</button>
    </div>

    <div id="panel-table" class="panel active">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Status</th>
            <th>Test</th>
            <th>Details</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div id="panel-json" class="panel">
      <textarea readonly>${jsonData}</textarea>
    </div>

    <div id="panel-csv" class="panel">
      <textarea readonly>${csvData}</textarea>
    </div>

    <div class="muted">Generated by SKYNET automation helper.</div>
  </div>

  <script>
    const jsonPayload = ${JSON.stringify(JSON.stringify(results, null, 2))};
    const csvPayload = ${JSON.stringify(
      [["status", "test", "details", "time", "url"].join(",")]
        .concat(
          results.map(function (result) {
            return [
              result.status,
              result.test,
              typeof result.details === "string"
                ? result.details
                : JSON.stringify(result.details),
              result.time,
              result.url,
            ]
              .map(function (value) {
                return '"' + String(value).replace(/"/g, '""') + '"';
              })
              .join(",");
          })
        )
        .join("\n")
    )};

    function dl(name, content, type) {
      const blob = new Blob([content], { type: type });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      document.body.appendChild(link);
      link.click();

      setTimeout(function () {
        URL.revokeObjectURL(link.href);
        link.remove();
      }, 500);
    }

    function downloadJSON() {
      dl("skynet-report.json", jsonPayload, "application/json");
    }

    function downloadCSV() {
      dl("skynet-report.csv", csvPayload, "text/csv;charset=utf-8");
    }

    function showTab(name) {
      document.querySelectorAll(".panel").forEach(function (panel) {
        panel.classList.remove("active");
      });

      document.getElementById("panel-" + name).classList.add("active");
    }
  </script>
</body>
</html>
    `);

    reportWindow.document.close();
  }

  function skynetGraphic() {
    if (document.getElementById("skynet-overlay")) {
      return;
    }

    const box = document.createElement("div");
    box.id = "skynet-overlay";

    box.style.cssText = [
      "position:fixed",
      "top:18px",
      "right:18px",
      "width:270px",
      "height:150px",
      "background:radial-gradient(circle at 50% 50%,rgba(60,0,0,.35),#050505 65%)",
      "border:2px solid #ff2a2a",
      "border-radius:14px",
      "box-shadow:0 0 10px #ff2a2a, inset 0 0 28px rgba(255,0,0,.22)",
      "z-index:999999",
      "font-family:Consolas,monospace",
      "overflow:hidden",
    ].join(";");

    box.innerHTML = `
      <div style="position:absolute;top:14px;left:18px;color:#ff3b3b;font-size:28px;font-weight:700;letter-spacing:3px;text-shadow:0 0 10px #ff0000">
        SKYNET
      </div>

      <div style="position:absolute;bottom:16px;left:18px;color:#ff9a9a;font-size:11px;letter-spacing:2px">
        AUTOMATION CORE ONLINE
      </div>

      <div style="position:absolute;right:18px;top:24px;width:92px;height:92px;border-radius:50%;background:radial-gradient(circle,#ffb3b3 0,#ff4a4a 12%,#ff0000 28%,#450000 45%,#0c0000 60%,transparent 62%);box-shadow:0 0 12px #ff0000,0 0 28px rgba(255,0,0,.75),inset 0 0 18px rgba(255,255,255,.18)">
      </div>

      <div style="position:absolute;right:58px;top:28px;width:12px;height:84px;background:linear-gradient(180deg,transparent,rgba(255,255,255,.35),transparent);filter:blur(1px);animation:skynetEyePulse 1.8s ease-in-out infinite">
      </div>

      <div style="position:absolute;right:21px;top:68px;width:86px;height:2px;background:#ff3b3b;box-shadow:0 0 8px #ff0000;animation:skynetScanX 2.2s linear infinite">
      </div>

      <div style="position:absolute;right:62px;top:27px;width:2px;height:86px;background:#ff3b3b;box-shadow:0 0 8px #ff0000;animation:skynetScanY 2.2s linear infinite">
      </div>

      <div style="position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0 6px,rgba(255,0,0,.04) 7px 8px);pointer-events:none">
      </div>

      <div style="position:absolute;top:0;left:-60px;width:60px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,0,0,.26),transparent);transform:skewX(-20deg);animation:skynetSweep 2.4s linear infinite">
      </div>
    `;

    if (!document.getElementById("skynet-style")) {
      const style = document.createElement("style");
      style.id = "skynet-style";
      style.textContent = `
        @keyframes skynetSweep {
          0% { left: -60px; }
          100% { left: 320px; }
        }

        @keyframes skynetEyePulse {
          0%,100% { opacity: .55; transform: scaleY(.92); }
          50% { opacity: 1; transform: scaleY(1); }
        }

        @keyframes skynetScanX {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes skynetScanY {
          0%,100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(box);
  }

  function createMissingApi(selector) {
    return {
      click: function () {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " exists", {
          expected: "found",
          actual: "not found",
        });
        return this;
      },

      type: function () {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " exists", {
          expected: "found",
          actual: "not found",
        });
        return this;
      },

      shouldContainText: function (text) {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " should contain text", {
          expected: text,
          actual: "not found",
        });
        return this;
      },

      shouldHaveText: function (text) {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " should have text", {
          expected: text,
          actual: "not found",
        });
        return this;
      },

      shouldContainValue: function (value) {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " should contain value", {
          expected: value,
          actual: "not found",
        });
        return this;
      },

      shouldHaveValue: function (value) {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " should have value", {
          expected: value,
          actual: "not found",
        });
        return this;
      },

      shouldBeChecked: function (expected) {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " checked state", {
          expected: expected,
          actual: "not found",
        });
        return this;
      },

      shouldBeTrue: function () {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " should be checked", {
          expected: true,
          actual: "not found",
        });
        return this;
      },

      shouldBeFalse: function () {
        console.error("❌ FAIL - element not found:", selector);
        addResult("FAIL", "Element " + selector + " should be unchecked", {
          expected: false,
          actual: "not found",
        });
        return this;
      },
    };
  }

  function createElementApi(selector, element) {
    return {
      click: function () {
        console.log("Click:", selector);
        element.click();
        addResult("PASS", "Element " + selector + " clicked", "click executed");
        return this;
      },

      type: function (value) {
        console.log("Type:", value);
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        addResult("PASS", "Element " + selector + " typed value", value);
        return this;
      },

      shouldContainText: function (text) {
        const ok = (element.textContent || "").includes(text);

        if (ok) {
          console.log("✅ PASS - text contains:", text);
          addResult("PASS", "Element " + selector + " should contain text", text);
        } else {
          console.error("❌ FAIL - text does not contain:", text);
          addResult("FAIL", "Element " + selector + " should contain text", {
            expected: text,
            actual: element.textContent,
          });
        }

        return this;
      },

      shouldHaveText: function (text) {
        const ok = (element.textContent || "") === text;

        if (ok) {
          console.log("✅ PASS - text equals:", text);
          addResult("PASS", "Element " + selector + " should have text", text);
        } else {
          console.error("❌ FAIL - text not equal:", text);
          addResult("FAIL", "Element " + selector + " should have text", {
            expected: text,
            actual: element.textContent,
          });
        }

        return this;
      },

      shouldContainValue: function (value) {
        const ok = String(element.value || "").includes(value);

        if (ok) {
          console.log("✅ PASS - value contains:", value);
          addResult("PASS", "Element " + selector + " should contain value", value);
        } else {
          console.error("❌ FAIL - value does not contain:", value);
          addResult("FAIL", "Element " + selector + " should contain value", {
            expected: value,
            actual: element.value,
          });
        }

        return this;
      },

      shouldHaveValue: function (value) {
        const ok = element.value === value;

        if (ok) {
          console.log("✅ PASS - value equals:", value);
          addResult("PASS", "Element " + selector + " should have value", value);
        } else {
          console.error("❌ FAIL - value not equal:", value);
          addResult("FAIL", "Element " + selector + " should have value", {
            expected: value,
            actual: element.value,
          });
        }

        return this;
      },

      shouldBeChecked: function (expected) {
        const value = typeof expected === "boolean" ? expected : true;
        const ok = element.checked === value;

        if (ok) {
          console.log("✅ PASS - checked equals:", value);
          addResult("PASS", "Element " + selector + " checked state", value);
        } else {
          console.error("❌ FAIL - checked not equal:", {
            expected: value,
            actual: element.checked,
          });
          addResult("FAIL", "Element " + selector + " checked state", {
            expected: value,
            actual: element.checked,
          });
        }

        return this;
      },

      shouldBeTrue: function () {
        const ok = element.checked === true;

        if (ok) {
          console.log("✅ PASS - checked is true");
          addResult("PASS", "Element " + selector + " should be checked", true);
        } else {
          console.error("❌ FAIL - checked is not true", {
            actual: element.checked,
          });
          addResult("FAIL", "Element " + selector + " should be checked", {
            expected: true,
            actual: element.checked,
          });
        }

        return this;
      },

      shouldBeFalse: function () {
        const ok = element.checked === false;

        if (ok) {
          console.log("✅ PASS - checked is false");
          addResult("PASS", "Element " + selector + " should be unchecked", false);
        } else {
          console.error("❌ FAIL - checked is not false", {
            actual: element.checked,
          });
          addResult("FAIL", "Element " + selector + " should be unchecked", {
            expected: false,
            actual: element.checked,
          });
        }

        return this;
      },
    };
  }

  window.skynet = {
    results: results,
    report: report,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    waitFor: waitFor,

    clearResults: function () {
      results.length = 0;
      console.log("SKYNET results cleared");
    },

    get: function (selector) {
      const element = document.querySelector(selector);

      if (!element) {
        return createMissingApi(selector);
      }

      return createElementApi(selector, element);
    },

    table: function (selector) {
      const element = document.querySelector(selector);

      return {
        shouldMatchData: function (expected) {
          if (!element) {
            console.error("❌ FAIL - table not found:", selector);
            addResult("FAIL", "Table " + selector + " should exist", {
              expected: "found",
              actual: "not found",
            });
            return this;
          }

          const actual = extractTableData(element);
          const ok = sameData(actual, expected);

          if (ok) {
            console.log("✅ PASS - table matches expected data");
            addResult("PASS", "Table " + selector + " should match data", expected);
          } else {
            console.error("❌ FAIL - table mismatch", {
              expected: expected,
              actual: actual,
            });
            addResult("FAIL", "Table " + selector + " should match data", {
              expected: expected,
              actual: actual,
            });
          }

          return this;
        },
      };
    },
  };

  console.log("SKYNET Automation Core Online - Created by Petros Plakogiannis, 2026");
  skynetGraphic();
})();