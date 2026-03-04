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

    console.log("");
    console.log("5 MOST RECENT SUCCEEDED PAYMENTS - VERIFICATION REPORT");
    console.log("=".repeat(80));
    console.log("");

    const summary = [];

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

      console.log(`RECORD ${i + 1}`);
      console.log("-".repeat(80));
      console.log(`ID:                          ${row.id}`);
      console.log(`Created At:                  ${row.created_at}`);
      console.log(
        `Amount (Gross Revenue):      ${grossAmount.toFixed(2)} ${row.currency}`,
      );
      console.log(
        `Subtotal Amount (Tickets):   ${hasNullValues ? "NULL" : subtotalAmount.toFixed(2)} ${row.currency}`,
      );
      console.log(
        `Service Fee Amount (10%):    ${hasNullValues ? "NULL" : serviceFee.toFixed(2)} ${row.currency}`,
      );
      console.log(
        `Organizer Amount:            ${hasNullValues ? "NULL" : organizerAmount.toFixed(2)} ${row.currency}`,
      );
      console.log(`Currency:                    ${row.currency}`);
      console.log(`Status:                      ${row.status}`);
      console.log("");

      if (!hasNullValues) {
        console.log(`VERIFICATION:`);
        console.log(
          `  Service Fee ($${serviceFee.toFixed(2)}) + Organizer ($${organizerAmount.toFixed(2)}) = $${calcTotal.toFixed(2)}`,
        );
        console.log(`  Gross Amount = $${grossAmount.toFixed(2)}`);
        console.log(
          `  RESULT: ${matches ? "PASS - Match!" : "FAIL - Mismatch by $" + Math.abs(grossAmount - calcTotal).toFixed(2)}`,
        );
        summary.push({
          id: row.id,
          status: matches ? "PASS" : "FAIL",
          difference: Math.abs(grossAmount - calcTotal),
        });
      } else {
        console.log(`VERIFICATION: SKIPPED (NULL values in amount fields)`);
        summary.push({
          id: row.id,
          status: "SKIPPED",
          difference: null,
        });
      }
      console.log("");
    });

    console.log("=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));

    summary.forEach((item, i) => {
      console.log(
        `  Record ${i + 1} (ID ${item.id}): ${item.status}${item.difference !== null && item.difference > 0 ? " (Diff: $" + item.difference.toFixed(2) + ")" : ""}`,
      );
    });

    const passCount = summary.filter((s) => s.status === "PASS").length;
    const totalCount = summary.length;
    console.log("");
    console.log(
      `Total: ${passCount}/${totalCount} records match correctly (Fee + Organizer = Amount)`,
    );
    console.log("");

    await connection.end();
  } catch (err) {
    console.error("Database Error:", err.message);
    process.exit(1);
  }
})();
