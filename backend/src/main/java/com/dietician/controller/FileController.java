package com.dietician.controller;

import com.dietician.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API endpoints for serving uploaded files
 */
@Slf4j
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * Serve a file from the specified category
     */
    @GetMapping("/{category}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String category,
            @PathVariable String filename) {
        log.debug("Serving file: {}/{}", category, filename);
        Resource file = fileStorageService.loadFileAsResource(category, filename);

        // Determine content type
        String contentType = "application/octet-stream";
        if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (filename.toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        } else if (filename.toLowerCase().endsWith(".gif")) {
            contentType = "image/gif";
        } else if (filename.toLowerCase().endsWith(".pdf")) {
            contentType = "application/pdf";
        }

        // Cache-busting headers for profile photos to ensure fresh images after update
        // For other files, use standard caching
        long maxAge = "profile-photos".equals(category) ? 0 : 3600; // 0 seconds for photos, 1 hour for others
        String cacheControl = "public, max-age=" + maxAge +
                (maxAge == 0 ? ", must-revalidate, no-cache, no-store" : "");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, cacheControl)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }
}
