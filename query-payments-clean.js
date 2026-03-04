const mysql = require("mysql2/promise");

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "xfrizon_ts",
    });

    const [rows] = await connection.execute(`
      SELECT 
        id,
        created_at,
        amount,
        subtotal_amount,
        service_fee_amount,
        organizer_amount,
        currency,
        status
      FROM payment_records
      WHERE status = 'SUCCEEDED'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (rows.length === 0) {
      console.log("No succeeded payments found.");
      await connection.end();
      process.exit(0);
    }

    // Create a clean summary
    console.log("\n");
    console.log(
      "╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                               5 MOST RECENT SUCCEEDED PAYMENTS - DATABASE VERIFICATION                                        ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝",
    );
    console.log("\n");

    rows.forEach((row, i) => {
      const hasNullValues =
        row.service_fee_amount === null ||
        row.organizer_amount === null ||
        row.subtotal_amount === null;
      const serviceFee = parseFloat(row.service_fee_amount) || 0;
      const organizerAmount = parseFloat(row.organizer_amount) || 0;
      const subtotalAmount = parseFloat(row.subtotal_amount) || 0;
      const grossAmount = parseFloat(row.amount);
      const calcTotal = serviceFee + organizerAmount;
      const matches = Math.abs(grossAmount - calcTotal) < 0.01;

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`RECORD ${i + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID                              ${row.id}`);
      console.log(
        `Created At (Timestamp)          ${row.created_at.toISOString().replace("T", " ").replace("Z", " UTC")}`,
      );
      console.log(
        `Amount (Gross Revenue)          ${grossAmount.toFixed(2)} ${row.currency}`,
      );
      console.log(
        `Subtotal Amount (Ticket Price)  ${hasNullValues ? "NULL" : subtotalAmount.toFixed(2)} ${row.currency}`,
      );
      console.log(
        `Service Fee Amount (10%)        ${hasNullValues ? "NULL" : serviceFee.toFixed(2)} ${row.currency}`,
      );
      console.log(
        `Organizer Amount                ${hasNullValues ? "NULL" : organizerAmount.toFixed(2)} ${row.currency}`,
      );
      console.log(`Currency                        ${row.currency}`);
      console.log(`Status                          ${row.status}`);
      console.log("");

      if (!hasNullValues) {
        console.log(`VERIFICATION:`);
        console.log(
          `  Service Fee + Organizer Amount = ${serviceFee.toFixed(2)} + ${organizerAmount.toFixed(2)} = ${calcTotal.toFixed(2)} ${row.currency}`,
        );
        console.log(
          `  Gross Amount                      = ${grossAmount.toFixed(2)} ${row.currency}`,
        );
        console.log(
          `  Match? ${matches ? "[✓ YES] - Values match correctly!" : "[✗ NO] - MISMATCH DETECTED!"}`,
        );
      } else {
        console.log(
          `VERIFICATION: SKIPPED - NULL values found in amount fields`,
        );
      }
      console.log("");
    });

    // Summary stats
    const totalSucceeded = rows.length;
    const correctMatches = rows.filter((r) => {
      if (r.service_fee_amount === null || r.organizer_amount === null)
        return false;
      const serviceFee = parseFloat(r.service_fee_amount);
      const organizerAmount = parseFloat(r.organizer_amount);
      const grossAmount = parseFloat(r.amount);
      const calcTotal = serviceFee + organizerAmount;
      return Math.abs(grossAmount - calcTotal) < 0.01;
    }).length;

    console.log(
      "═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════",
    );
    console.log(
      `SUMMARY: ${correctMatches}/${totalSucceeded} records have correct fee + organizer amount calculations`,
    );
    console.log(
      "═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════",
    );
    console.log("");

    await connection.end();
  } catch (err) {
    console.error("Database Error:", err.message);
    process.exit(1);
  }
})();
