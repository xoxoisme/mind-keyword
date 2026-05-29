package com.xoxoisme.mindkeyword.global.openai.dto;

import java.util.List;

public record TreeNode(
        String content,
        List<TreeNode> children
) {
}
