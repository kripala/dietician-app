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
     * Handle runtime exceptions (business logic errors)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<AuthDto.MessageResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime error: {}", ex.getMessage(), ex);
        return ResponseEntity.badRequest().body(new AuthDto.MessageResponse(ex.getMessage()));
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
