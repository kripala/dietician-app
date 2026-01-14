package com.dietician.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Service for handling file storage operations
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.dir:/var/dietician/uploads}")
    private String uploadDir;

    /**
     * Store a file in the specified category
     *
     * @param file     The file to store
     * @param category The category (e.g., "profile-photos")
     * @param entityId The entity ID for naming
     * @return The URL to access the file
     */
    public String storeFile(MultipartFile file, String category, String entityId) {
        try {
            // Create directory if not exists
            Path uploadPath = Paths.get(uploadDir, category);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = entityId + "_" + System.currentTimeMillis() + extension;

            // Store file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File stored successfully: {}", filename);

            // Return URL path
            return "/api/files/" + category + "/" + filename;

        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }

    /**
     * Load a file as a Resource
     *
     * @param category The category
     * @param filename The filename
     * @return The file as a Resource
     */
    public Resource loadFileAsResource(String category, String filename) {
        try {
            Path filePath = Paths.get(uploadDir, category).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                log.error("File not found or not readable: {}", filePath);
                throw new RuntimeException("File not found: " + filename);
            }
        } catch (MalformedURLException e) {
            log.error("Error loading file", e);
            throw new RuntimeException("File not found: " + filename, e);
        }
    }

    /**
     * Delete a file
     *
     * @param category The category
     * @param filename The filename
     */
    public void deleteFile(String category, String filename) {
        try {
            Path filePath = Paths.get(uploadDir, category).resolve(filename).normalize();
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", filename);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filename, e);
            throw new RuntimeException("Failed to delete file: " + e.getMessage());
        }
    }
}
