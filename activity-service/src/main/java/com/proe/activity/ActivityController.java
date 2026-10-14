
package com.proe.activity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ActivityController {

    @GetMapping("/api/health")
    public String health() {
        return "PROE Backend is running successfully!";
    }
}
