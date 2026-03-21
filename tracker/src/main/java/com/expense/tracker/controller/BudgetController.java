package com.expense.tracker.controller;

import com.expense.tracker.model.Budget;
import com.expense.tracker.repository.BudgetRepository;
import com.expense.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BudgetController {

    private final BudgetRepository budgetRepo;
    private final UserRepository userRepo;

    @GetMapping
    public List<Budget> getAll(Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();
        return budgetRepo.findByUserIdAndMonthAndYear(user.getId(), month, year);
    }

    @PostMapping
    public Budget create(@RequestBody Budget budget, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        budget.setUser(user);
        if (budget.getMonth() == 0) budget.setMonth(LocalDate.now().getMonthValue());
        if (budget.getYear() == 0) budget.setYear(LocalDate.now().getYear());
        return budgetRepo.save(budget);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> update(@PathVariable Long id,
                                         @RequestBody Budget updated, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return budgetRepo.findById(id)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .map(b -> { b.setLimitAmount(updated.getLimitAmount());
                    b.setCategory(updated.getCategory());
                    return ResponseEntity.ok(budgetRepo.save(b)); })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return budgetRepo.findById(id)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .map(b -> { budgetRepo.delete(b);
                    return ResponseEntity.ok().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }
}