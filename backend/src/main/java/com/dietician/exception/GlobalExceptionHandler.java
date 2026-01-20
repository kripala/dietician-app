package com.dietician.exception;

import com.dietician.dto.AuthDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.stream.Collectors;

/**
 * Global exception handler for consistent error responses across all controllers.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors from @Valid annotation
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthDto.MessageResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        log.error("Validation error: {}", errorMessage);
        return ResponseEntity.badRequest().body(new AuthDto.MessageResponse(errorMessage));
    }

    /**
     * Handle authentication errors (wrong password, etc.)
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<AuthDto.MessageResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.error("Authentication failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthDto.MessageResponse("Invalid email or password"));
    }

    /**
     * Handle file size exceeded exception
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<AuthDto.MessageResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        log.warn("File upload size exceeded: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new AuthDto.MessageResponse("File size too large. Maximum allowed size is 5MB.")
        );
    }

    /**
     * Handle runtime exceptions (business logic errors)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<AuthDto.MessageResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime error: {}", ex.getMessage(), ex);

        // Provide user-friendly message for common errors
        String message = ex.getMessage();
        if (message != null) {
            if (message.contains("ClassCastException")) {
                message = "An error occurred while processing your request. Please try again.";
            } else if (message.contains("ClassCastException")) {
                message = "An error occurred while processing your request. Please try again.";
            }
        }

        return ResponseEntity.badRequest().body(new AuthDto.MessageResponse(message));
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthDto.MessageResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthDto.MessageResponse("An unexpected error occurred. Please try again."));
    }
}
