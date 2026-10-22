package com.proe.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Single place that decides where uploaded PDFs are stored, so the upload
 * and download servlets can never disagree.
 *
 * Order of precedence:
 *   1. environment variable PROE_UPLOAD_DIR
 *   2. JVM system property  -Dproe.upload.dir=...
 *   3. the old default folder PROE/uploads on drive D:, when running on
 *      Windows and drive D: exists (used before this setting existed)
 *   4. ~/proe-uploads
 */
public final class UploadConfig {

    private static final String LEGACY_WINDOWS_DIR = "D:\\PROE\\uploads";

    public static final Path UPLOAD_DIR = resolve();

    private UploadConfig() {
    }

    private static Path resolve() {
        String configured = System.getenv("PROE_UPLOAD_DIR");

        if (configured == null || configured.isBlank()) {
            configured = System.getProperty("proe.upload.dir");
        }

        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured.trim()).toAbsolutePath().normalize();
        }

        if (java.io.File.separatorChar == '\\') {
            Path legacy = Paths.get(LEGACY_WINDOWS_DIR);

            if (legacy.getRoot() != null && Files.exists(legacy.getRoot())) {
                return legacy.toAbsolutePath().normalize();
            }
        }

        return Paths.get(System.getProperty("user.home"), "proe-uploads")
                .toAbsolutePath().normalize();
    }
}
