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

    console.log("=".repeat(140));
    console.log("5 MOST RECENT SUCCEEDED PAYMENTS");
    console.log("=".repeat(140));
    console.log();

    if (rows.length === 0) {
      console.log("No succeeded payments found in the database.");
      await connection.end();
      process.exit(0);
    }

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

      console.log(`Record ${i + 1}:`);
      console.log(`  ID:                                 ${row.id}`);
      console.log(
        `  Created At:                         ${new Date(row.created_at).toISOString()}`,
      );
      console.log(
        `  Amount (Gross Revenue):             $${grossAmount.toFixed(2)}`,
      );
      console.log(
        `  Subtotal Amount (Ticket Price):     $${hasNullValues ? "NULL" : subtotalAmount.toFixed(2)}`,
      );
      console.log(
        `  Service Fee Amount (10%):           $${hasNullValues ? "NULL" : serviceFee.toFixed(2)}`,
      );
      console.log(
        `  Organizer Amount:                   $${hasNullValues ? "NULL" : organizerAmount.toFixed(2)}`,
      );
      console.log(`  Currency:                           ${row.currency}`);
      console.log(`  Status:                             ${row.status}`);
      if (!hasNullValues) {
        console.log(
          `  Verification: Fee + Organizer =     $${calcTotal.toFixed(2)}`,
        );
        console.log(
          `  Match with Amount?                  ${matches ? "✓ YES - Amounts match!" : "✗ NO - Mismatch detected!"}`,
        );
      } else {
        console.log(
          `  Verification:                       SKIPPED (NULL values detected)`,
        );
      }
      console.log();
    });

    await connection.end();
  } catch (err) {
    console.error("Database Error:", err.message);
    process.exit(1);
  }
})();
