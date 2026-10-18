
package com.proe.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    public static Connection getConnection() throws SQLException {
    try {
        Class.forName("com.mysql.cj.jdbc.Driver");
    } catch (ClassNotFoundException e) {
        throw new SQLException("MySQL JDBC driver is missing from the runtime.", e);
    }

    String url = System.getenv("PROE_DB_URL");
    String user = System.getenv("PROE_DB_USER");
    String password = System.getenv("PROE_DB_PASSWORD");

        if (url == null || user == null || password == null) {
            throw new SQLException(
                "Database configuration is missing. Set PROE_DB_URL, PROE_DB_USER and PROE_DB_PASSWORD."
            );
        }

        return DriverManager.getConnection(url, user, password);
    }
}
